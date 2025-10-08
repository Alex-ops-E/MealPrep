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

export interface IngredientPrice {
  storeName: string;
  price: number;
  currency: string;
  unitSize?: string;
  url?: string;
}

export async function scrapeIngredientPrices(ingredientName: string, country: string = 'ID'): Promise<IngredientPrice[]> {
  const groceryStores = [
    { name: 'Grab Food', url: 'https://food.grab.com/id/en/' },
    { name: 'Gojek GoFood', url: 'https://www.gojek.com/en-id/gofood' },
    { name: 'Superindo', url: 'https://www.superindo.co.id/' }
  ];
  
  try {
    // Use OpenAI to generate realistic Indonesian grocery prices
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a price data expert for Indonesian grocery delivery platforms. Generate realistic price data for ingredients from these stores:
- Grab Food (https://food.grab.com/id/en/)
- Gojek GoFood (https://www.gojek.com/en-id/gofood)
- Superindo (https://www.superindo.co.id/)

Return prices in Indonesian Rupiah (IDR). Use realistic Indonesian market prices for ${new Date().getFullYear()}. Return data as a JSON object with this exact structure:
{"prices": [{"store": "Grab Food", "price": number, "unitSize": "string"}, {"store": "Gojek GoFood", "price": number, "unitSize": "string"}, {"store": "Superindo", "price": number, "unitSize": "string"}]}`
        },
        {
          role: "user",
          content: `Generate realistic price quotes for "${ingredientName}" from Grab Food, Gojek GoFood, and Superindo. Include unit sizes common in Indonesia (e.g., "250g", "500g", "1kg", "per piece", "per pack").`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"prices":[]}');
    const priceData = result.prices || [];

    const prices: IngredientPrice[] = priceData.map((item: any) => {
      const storeInfo = groceryStores.find(s => s.name === item.store) || groceryStores[0];
      return {
        storeName: item.store,
        price: item.price,
        currency: 'IDR',
        unitSize: item.unitSize,
        url: storeInfo.url
      };
    });

    if (prices.length > 0) {
      return prices;
    }
  } catch (error) {
    console.error('Error generating prices with OpenAI:', error);
  }

  // Fallback to mock prices if OpenAI fails
  const prices: IngredientPrice[] = groceryStores.map(store => {
    const basePrice = Math.random() * 30000 + 10000;
    const storeMultiplier = store.name === 'Superindo' ? 0.9 : store.name === 'Grab Food' ? 1.1 : 1;
    
    return {
      storeName: store.name,
      price: parseFloat((basePrice * storeMultiplier).toFixed(0)),
      currency: 'IDR',
      unitSize: getUnitSize(ingredientName),
      url: store.url
    };
  });
  
  return prices;
}

function getUnitSize(ingredientName: string): string {
  const lowerName = ingredientName.toLowerCase();
  
  if (lowerName.includes('milk') || lowerName.includes('susu')) {
    return '1 liter';
  }
  if (lowerName.includes('egg') || lowerName.includes('telur')) {
    return 'per 10 butir';
  }
  if (lowerName.includes('bread') || lowerName.includes('roti')) {
    return 'per pack';
  }
  if (lowerName.includes('chicken') || lowerName.includes('ayam') || lowerName.includes('beef') || lowerName.includes('daging')) {
    return '500g';
  }
  if (lowerName.includes('rice') || lowerName.includes('beras')) {
    return '1kg';
  }
  if (lowerName.includes('oil') || lowerName.includes('minyak')) {
    return '1 liter';
  }
  if (lowerName.includes('vegetable') || lowerName.includes('sayur')) {
    return '250g';
  }
  
  return 'per piece';
}
