import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, BarChart3 } from "lucide-react";

const countries = [
  { code: "US", flag: "🇺🇸", name: "United States" },
  { code: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "DE", flag: "🇩🇪", name: "Germany" },
];

interface HeaderProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
}

export default function Header({ selectedCountry, onCountryChange }: HeaderProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Search", active: location === "/" },
    { href: "/trending", label: "Trending", active: location === "/trending" },
    { href: "/alerts", label: "Price Alerts", active: location === "/alerts" },
    { href: "/categories", label: "Categories", active: location === "/categories" },
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-foreground">PriceWise</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors ${
                  item.active 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Country Selector & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Select value={selectedCountry} onValueChange={onCountryChange}>
              <SelectTrigger className="w-48" data-testid="select-country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center space-x-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="secondary" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col space-y-4 mt-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`font-medium transition-colors ${
                        item.active 
                          ? "text-primary" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setIsOpen(false)}
                      data-testid={`mobile-link-${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
