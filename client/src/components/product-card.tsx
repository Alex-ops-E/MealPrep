import { Link } from "wouter";
import { Bell, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProductWithPrices } from "@shared/schema";

interface ProductCardProps {
  product: ProductWithPrices;
}

export default function ProductCard({ product }: ProductCardProps) {
  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const bestPrice = sortedPrices[0];
  const worstPrice = sortedPrices[sortedPrices.length - 1];

  const formatPrice = (price: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  const formatShipping = (shipping?: number) => {
    if (!shipping || shipping === 0) return "Free shipping";
    return `$${shipping.toFixed(2)} shipping`;
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border hover:shadow-lg transition-shadow" data-testid={`card-product-${product.id}`}>
      <div className="p-6">
        {/* Product Image */}
        <div className="relative mb-4">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop"}
            alt={product.name}
            className="w-full h-48 object-cover rounded-lg"
            data-testid={`img-product-${product.id}`}
          />
          {sortedPrices.length > 1 && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              {sortedPrices.length} stores
            </Badge>
          )}
        </div>
        
        {/* Product Info */}
        <h3 className="font-semibold text-foreground mb-2" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
          {product.description}
        </p>
        
        {/* Price Comparison */}
        <div className="space-y-3">
          {sortedPrices.slice(0, 3).map((price, index) => (
            <div
              key={price.id}
              className={`flex justify-between items-center p-3 rounded-lg border ${
                index === 0
                  ? "bg-accent/10 border-accent/20"
                  : "bg-secondary/50 border-border"
              }`}
              data-testid={`price-item-${price.id}`}
            >
              <div className="flex items-center space-x-2">
                <img
                  src={price.store.logo || `https://via.placeholder.com/24x24/6366f1/ffffff?text=${price.store.name.charAt(0)}`}
                  alt={price.store.name}
                  className="w-6 h-6 rounded"
                  data-testid={`img-store-${price.store.id}`}
                />
                <span className="text-sm font-medium" data-testid={`text-store-name-${price.store.id}`}>
                  {price.store.name}
                </span>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${index === 0 ? "text-accent" : ""}`} data-testid={`text-price-${price.id}`}>
                  {formatPrice(price.price, price.currency)}
                </div>
                <div className="text-xs text-muted-foreground" data-testid={`text-shipping-${price.id}`}>
                  {formatShipping(price.shipping)}
                </div>
              </div>
            </div>
          ))}
          
          {sortedPrices.length > 3 && (
            <div className="text-center text-sm text-muted-foreground">
              +{sortedPrices.length - 3} more stores
            </div>
          )}
        </div>
        
        {/* Price Range Summary */}
        {sortedPrices.length > 1 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Price range:</span>
              <span className="font-medium">
                {formatPrice(bestPrice.price)} - {formatPrice(worstPrice.price)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">You save:</span>
              <span className="font-medium text-accent">
                {formatPrice(worstPrice.price - bestPrice.price)}
              </span>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex space-x-2 mt-4">
          <Button asChild className="flex-1" data-testid={`button-view-details-${product.id}`}>
            <Link href={`/product/${product.id}`}>
              View Details
            </Link>
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            title="Set Price Alert"
            data-testid={`button-price-alert-${product.id}`}
          >
            <Bell className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            title="Add to Favorites"
            data-testid={`button-favorite-${product.id}`}
          >
            <Heart className="h-4 w-4" />
          </Button>
          
          {bestPrice && (
            <Button
              variant="secondary"
              size="icon"
              title="Visit Store"
              asChild
              data-testid={`button-visit-store-${product.id}`}
            >
              <a href={bestPrice.url || bestPrice.store.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
