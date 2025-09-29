import { ExtractedProductInfo, ExtractedPriceInfo, extractProductInfo, extractPricesFromUrls } from './openai';

export interface ScrapeResult {
  products: ExtractedProductInfo[];
  prices: ExtractedPriceInfo[];
  errors: string[];
}

// Mock e-commerce URLs for different countries
const ECOMMERCE_SITES = {
  US: [
    'https://amazon.com',
    'https://bestbuy.com',
    'https://target.com',
    'https://walmart.com',
    'https://newegg.com'
  ],
  CA: [
    'https://amazon.ca',
    'https://bestbuy.ca',
    'https://canadiantire.ca',
    'https://thesource.ca'
  ],
  GB: [
    'https://amazon.co.uk',
    'https://currys.co.uk',
    'https://argos.co.uk',
    'https://johnlewis.com'
  ],
  AU: [
    'https://amazon.com.au',
    'https://jbhifi.com.au',
    'https://harveynorman.com.au',
    'https://officeworks.com.au'
  ],
  DE: [
    'https://amazon.de',
    'https://mediamarkt.de',
    'https://saturn.de',
    'https://otto.de'
  ]
};

export async function scrapeProductPrices(query: string, country: string = 'US'): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    products: [],
    prices: [],
    errors: []
  };

  try {
    // Get country-specific e-commerce sites
    const sites = ECOMMERCE_SITES[country as keyof typeof ECOMMERCE_SITES] || ECOMMERCE_SITES.US;
    
    // For MVP, we'll simulate web scraping by generating mock HTML content
    // In production, you would use Puppeteer/Playwright to actually scrape websites
    const mockHtmlContent = generateMockHtmlContent(query, country);
    
    // Extract product information using GPT
    const extractedProducts = await extractProductInfo(mockHtmlContent, query);
    result.products = extractedProducts;

    // Generate URLs for price comparison
    const searchUrls = sites.map(site => `${site}/search?q=${encodeURIComponent(query)}`);
    
    // Extract prices from URLs using GPT
    const extractedPrices = await extractPricesFromUrls(searchUrls, query);
    result.prices = extractedPrices;

  } catch (error) {
    console.error('Error scraping product prices:', error);
    result.errors.push(`Scraping failed: ${(error as Error).message}`);
  }

  return result;
}

function generateMockHtmlContent(query: string, country: string): string {
  // This simulates HTML content that would be scraped from e-commerce sites
  // In production, replace this with actual web scraping using Puppeteer/Playwright
  
  const queryLower = query.toLowerCase();
  let mockProducts = '';

  if (queryLower.includes('iphone')) {
    mockProducts = `
      <div class="product">
        <h2>iPhone 15 Pro 128GB</h2>
        <span class="price">$999.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">In stock</span>
        <img src="https://images.unsplash.com/photo-1592286075296-b1826c1ac2e7" alt="iPhone 15 Pro">
        <p class="description">Latest flagship with titanium design and A17 Pro chip</p>
      </div>
      <div class="product">
        <h2>iPhone 14 128GB</h2>
        <span class="price">$699.00</span>
        <span class="shipping">$15.99 shipping</span>
        <span class="stock">In stock</span>
        <p class="description">Previous generation iPhone with A15 Bionic chip</p>
      </div>
    `;
  } else if (queryLower.includes('macbook')) {
    mockProducts = `
      <div class="product">
        <h2>MacBook Air M2 256GB</h2>
        <span class="price">$1199.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">In stock</span>
        <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853" alt="MacBook Air">
        <p class="description">Lightweight laptop with M2 chip and all-day battery life</p>
      </div>
      <div class="product">
        <h2>MacBook Pro 14-inch M3</h2>
        <span class="price">$1999.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">Limited stock</span>
        <p class="description">Professional laptop with M3 Pro chip</p>
      </div>
    `;
  } else if (queryLower.includes('airpods')) {
    mockProducts = `
      <div class="product">
        <h2>AirPods Pro (2nd Gen)</h2>
        <span class="price">$249.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">In stock</span>
        <img src="https://images.unsplash.com/photo-1583394838336-acd977736f90" alt="AirPods Pro">
        <p class="description">Active noise cancellation with spatial audio</p>
      </div>
    `;
  } else {
    // Generic product template
    mockProducts = `
      <div class="product">
        <h2>${query} - Premium Model</h2>
        <span class="price">$299.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">In stock</span>
        <p class="description">High-quality ${query} with premium features</p>
      </div>
      <div class="product">
        <h2>${query} - Standard Model</h2>
        <span class="price">$199.00</span>
        <span class="shipping">$9.99 shipping</span>
        <span class="stock">In stock</span>
        <p class="description">Standard ${query} with essential features</p>
      </div>
    `;
  }

  return `
    <html>
      <head><title>E-commerce Search Results</title></head>
      <body>
        <div class="search-results">
          <h1>Search results for "${query}" in ${country}</h1>
          ${mockProducts}
        </div>
      </body>
    </html>
  `;
}

export async function getProductAvailabilityUrls(productName: string, country: string = 'US'): Promise<string[]> {
  const sites = ECOMMERCE_SITES[country as keyof typeof ECOMMERCE_SITES] || ECOMMERCE_SITES.US;
  return sites.map(site => `${site}/search?q=${encodeURIComponent(productName)}`);
}
