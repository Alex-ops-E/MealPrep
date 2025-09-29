import { Link } from "wouter";
import { BarChart3, Twitter, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold">PriceWise</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Find the best prices across multiple retailers with AI-powered comparison technology.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/search" className="hover:text-foreground transition-colors" data-testid="link-price-comparison">
                  Price Comparison
                </Link>
              </li>
              <li>
                <Link href="/alerts" className="hover:text-foreground transition-colors" data-testid="link-price-alerts">
                  Price Alerts
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:text-foreground transition-colors" data-testid="link-store-reviews">
                  Store Reviews
                </Link>
              </li>
              <li>
                <Link href="/mobile" className="hover:text-foreground transition-colors" data-testid="link-mobile-app">
                  Mobile App
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground transition-colors" data-testid="link-help-center">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors" data-testid="link-contact">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-terms">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground mb-4">Connect</h3>
            <div className="flex space-x-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary text-secondary-foreground p-2 rounded-lg hover:bg-secondary/80 transition-colors"
                data-testid="link-twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary text-secondary-foreground p-2 rounded-lg hover:bg-secondary/80 transition-colors"
                data-testid="link-facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary text-secondary-foreground p-2 rounded-lg hover:bg-secondary/80 transition-colors"
                data-testid="link-instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; 2024 PriceWise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
