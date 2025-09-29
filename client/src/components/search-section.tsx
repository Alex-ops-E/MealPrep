import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SearchParams } from "@shared/schema";

const categories = [
  "All Categories",
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Sports",
  "Books",
  "Health & Beauty",
  "Automotive",
  "Toys & Games"
];

interface SearchSectionProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
  country: string;
}

export default function SearchSection({ onSearch, isLoading, country }: SearchSectionProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;

    const searchParams: SearchParams = {
      query: query.trim(),
      category: category === "All Categories" ? undefined : category,
      country,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStockOnly,
      freeShippingOnly,
      page: 1,
      limit: 12
    };

    onSearch(searchParams);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Find the Best Prices</h1>
          <p className="text-xl text-muted-foreground">Compare prices across multiple retailers powered by AI</p>
        </div>
        
        {/* Search Bar */}
        <div className="bg-card rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search for products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="lg:w-48" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleSearch} 
              disabled={!query.trim() || isLoading}
              className="lg:px-8"
              data-testid="button-search"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
          
          {/* Advanced Filters */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Label className="text-muted-foreground">Price Range:</Label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-20"
                  data-testid="input-min-price"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-20"
                  data-testid="input-max-price"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={inStockOnly}
                  onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                  data-testid="checkbox-in-stock"
                />
                <Label htmlFor="inStock" className="text-muted-foreground">In Stock Only</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="freeShipping"
                  checked={freeShippingOnly}
                  onCheckedChange={(checked) => setFreeShippingOnly(checked as boolean)}
                  data-testid="checkbox-free-shipping"
                />
                <Label htmlFor="freeShipping" className="text-muted-foreground">Free Shipping</Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
