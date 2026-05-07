import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import PriceHistoryChart from "@/components/price-history-chart";
import { api } from "@/lib/api";
import { Link } from "wouter";

export default function ProductDetail() {
  const params = useParams();
  const productId = params.id as string;
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [targetPrice, setTargetPrice] = useState("");
  const [email, setEmail] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Product query
  const { data: product, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ["/api/products", productId],
    queryFn: () => api.getProduct(productId),
    enabled: !!productId,
  });

  // Price history query
  const { data: priceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/products", productId, "price-history"],
    queryFn: () => api.getPriceHistory(productId),
    enabled: !!productId,
  });

  // Price alert mutation
  const alertMutation = useMutation({
    mutationFn: api.createPriceAlert,
    onSuccess: () => {
      toast({
        title: "Price alert created",
        description: `You'll be notified when the price drops to $${targetPrice}`,
      });
      setTargetPrice("");
      setEmail("");
    },
    onError: (error) => {
      toast({
        title: "Failed to create alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAlert = () => {
    if (!targetPrice || !email || !product) {
      toast({
        title: "Missing information",
        description: "Please enter both target price and email address",
        variant: "destructive",
      });
      return;
    }

    alertMutation.mutate({
      productId: product.id,
      targetPrice: parseFloat(targetPrice),
      email,
    });
  };

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

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="bg-muted h-8 w-32 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-muted h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="bg-muted h-8 rounded"></div>
                <div className="bg-muted h-20 rounded"></div>
                <div className="bg-muted h-64 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product not found</h1>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Button asChild data-testid="button-back-home">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const bestPrice = sortedPrices[0];
  const worstPrice = sortedPrices[sortedPrices.length - 1];
  const avgPrice = sortedPrices.reduce((sum, p) => sum + p.price, 0) / sortedPrices.length;

  return (
    <div className="min-h-screen bg-background">
      <Header selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <Button variant="ghost" asChild className="mb-6" data-testid="button-back">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div>
            <img
              src={product.imageUrl || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop"}
              alt={product.name}
              className="w-full rounded-lg mb-4"
              data-testid="img-product-main"
            />
          </div>
          
          {/* Product Details */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-product-title">
                {product.name}
              </h1>
              <Badge variant="secondary" className="mb-4">
                {product.category}
              </Badge>
              <p className="text-muted-foreground" data-testid="text-product-description">
                {product.description}
              </p>
            </div>

            {/* Price Summary */}
            <div className="bg-muted/20 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-foreground mb-4">Price Overview</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-accent" data-testid="text-best-price">
                    {formatPrice(bestPrice?.price || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Best Price</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" data-testid="text-avg-price">
                    {formatPrice(avgPrice)}
                  </div>
                  <div className="text-sm text-muted-foreground">Average</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive" data-testid="text-highest-price">
                    {formatPrice(worstPrice?.price || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest</div>
                </div>
              </div>
              {sortedPrices.length > 1 && (
                <div className="mt-4 text-center">
                  <span className="text-accent font-semibold">
                    Save up to {formatPrice((worstPrice?.price || 0) - (bestPrice?.price || 0))}
                  </span>
                  <span className="text-muted-foreground"> by choosing the best store</span>
                </div>
              )}
            </div>
            
            {/* Price Alert Setup */}
            <div className="bg-accent/10 rounded-lg p-6 border border-accent/20">
              <h4 className="font-semibold text-foreground mb-3">Set Price Alert</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="targetPrice">Target Price ($)</Label>
                    <Input
                      id="targetPrice"
                      type="number"
                      placeholder="Target price"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      data-testid="input-target-price"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateAlert}
                  disabled={alertMutation.isPending}
                  className="w-full"
                  data-testid="button-create-alert"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {alertMutation.isPending ? "Creating Alert..." : "Create Alert"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                We'll notify you when the price drops to your target.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="stores" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stores" data-testid="tab-stores">Store Comparison</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Price History</TabsTrigger>
            <TabsTrigger value="specs" data-testid="tab-specs">Specifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stores" className="mt-6">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left py-4 px-6 font-medium text-foreground">Store</th>
                      <th className="text-left py-4 px-6 font-medium text-foreground">Price</th>
                      <th className="text-left py-4 px-6 font-medium text-foreground">Shipping</th>
                      <th className="text-left py-4 px-6 font-medium text-foreground">Stock</th>
                      <th className="text-left py-4 px-6 font-medium text-foreground">Rating</th>
                      <th className="text-left py-4 px-6 font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedPrices.map((price, index) => (
                      <tr key={price.id} className={index === 0 ? "bg-accent/5" : ""} data-testid={`row-store-${price.store.id}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <img
                              src={price.store.logo || `https://via.placeholder.com/32x32/6366f1/ffffff?text=${price.store.name.charAt(0)}`}
                              alt={price.store.name}
                              className="w-8 h-8 rounded"
                              data-testid={`img-store-logo-${price.store.id}`}
                            />
                            <span className="font-medium" data-testid={`text-store-name-${price.store.id}`}>
                              {price.store.name}
                            </span>
                            {index === 0 && (
                              <Badge variant="default" className="text-xs">Best Price</Badge>
                            )}
                          </div>
                        </td>
                        <td className={`py-4 px-6 font-bold ${index === 0 ? "text-accent" : ""}`} data-testid={`text-store-price-${price.store.id}`}>
                          {formatPrice(price.price, price.currency)}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground" data-testid={`text-store-shipping-${price.store.id}`}>
                          {formatShipping(price.shipping || undefined)}
                        </td>
                        <td className="py-4 px-6">
                          <Badge
                            variant={price.inStock ? "default" : "secondary"}
                            className={price.inStock ? "bg-accent/10 text-accent" : ""}
                            data-testid={`badge-stock-${price.store.id}`}
                          >
                            {price.inStock ? "In Stock" : "Out of Stock"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm" data-testid={`text-store-rating-${price.store.id}`}>
                              {price.store.rating?.toFixed(1) || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Button
                            variant={index === 0 ? "default" : "outline"}
                            size="sm"
                            asChild
                            data-testid={`button-visit-store-${price.store.id}`}
                          >
                            <a
                              href={price.url || price.store.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit Store
                            </a>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Price History (30 Days)</h3>
              {historyLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <PriceHistoryChart data={priceHistory || []} />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="specs" className="mt-6">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Product Specifications</h3>
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <span className="font-medium" data-testid={`text-spec-${key}`}>{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No specifications available for this product.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
