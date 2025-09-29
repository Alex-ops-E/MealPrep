import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Grid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import SearchSection from "@/components/search-section";
import ProductCard from "@/components/product-card";
import Footer from "@/components/footer";
import { api } from "@/lib/api";
import type { SearchParams } from "@shared/schema";

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("Best Match");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: api.search,
    onSuccess: (data) => {
      setCurrentPage(1);
      toast({
        title: "Search completed",
        description: `Found ${data.total} products`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Trending searches query
  const { data: trending } = useQuery({
    queryKey: ["/api/trending"],
    queryFn: () => api.getTrending(),
  });

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    searchMutation.mutate(params);
  };

  const handlePageChange = (page: number) => {
    if (!searchParams) return;
    
    const newParams = { ...searchParams, page };
    setSearchParams(newParams);
    setCurrentPage(page);
    searchMutation.mutate(newParams);
  };

  const searchResults = searchMutation.data;
  const totalPages = searchResults ? Math.ceil(searchResults.total / (searchParams?.limit || 12)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} />
      
      <SearchSection
        onSearch={handleSearch}
        isLoading={searchMutation.isPending}
        country={selectedCountry}
      />

      {/* Trending Section */}
      {!searchResults && trending && trending.length > 0 && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">Trending Searches</h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((item) => (
                <Button
                  key={item.query}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch({
                    query: item.query,
                    country: selectedCountry,
                    page: 1,
                    limit: 12
                  })}
                  data-testid={`button-trending-${item.query.replace(/\s+/g, '-')}`}
                >
                  {item.query} ({item.count})
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      {searchResults && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Search Results</h2>
                <p className="text-muted-foreground" data-testid="text-search-results-count">
                  Showing {((currentPage - 1) * (searchParams?.limit || 12)) + 1}-{Math.min(currentPage * (searchParams?.limit || 12), searchResults.total)} of {searchResults.total} results
                  {searchParams?.query && ` for "${searchParams.query}"`}
                </p>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                <span className="text-muted-foreground text-sm">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40" data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Best Match">Best Match</SelectItem>
                    <SelectItem value="Lowest Price">Lowest Price</SelectItem>
                    <SelectItem value="Highest Price">Highest Price</SelectItem>
                    <SelectItem value="Newest">Newest</SelectItem>
                    <SelectItem value="Customer Rating">Customer Rating</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex bg-secondary rounded-md p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    data-testid="button-view-grid"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    data-testid="button-view-list"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {searchMutation.isPending && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl shadow-sm border border-border p-6 animate-pulse">
                    <div className="bg-muted h-48 rounded-lg mb-4"></div>
                    <div className="bg-muted h-4 rounded mb-2"></div>
                    <div className="bg-muted h-3 rounded mb-4 w-3/4"></div>
                    <div className="space-y-2">
                      <div className="bg-muted h-12 rounded"></div>
                      <div className="bg-muted h-12 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {!searchMutation.isPending && searchResults.products.length > 0 && (
              <>
                <div className={`grid gap-6 mb-8 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                    : "grid-cols-1"
                }`}>
                  {searchResults.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || searchMutation.isPending}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => handlePageChange(page)}
                          disabled={searchMutation.isPending}
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <span className="px-2 text-muted-foreground">...</span>
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={searchMutation.isPending}
                          data-testid={`button-page-${totalPages}`}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || searchMutation.isPending}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* No Results */}
            {!searchMutation.isPending && searchResults.products.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchParams(null);
                    searchMutation.reset();
                  }}
                  data-testid="button-clear-search"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
