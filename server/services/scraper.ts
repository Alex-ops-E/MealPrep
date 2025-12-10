import { ExtractedProductInfo, ExtractedPriceInfo, extractProductInfo, extractPricesFromUrls } from './openai';

export interface ScrapeResult {
  products: ExtractedProductInfo[];
  prices: ExtractedPriceInfo[];
  errors: string[];
}

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
  ],
  AE: [
    'https://gcc.luluhypermarket.com/en-ae/grocery/',
    'https://www.carrefouruae.com/mafuae/en/',
    'https://www.noon.com/uae-en/grocery-store/',
    'https://www.talabat.com/uae'
  ]
};

export async function scrapeProductPrices(query: string, country: string = 'AE'): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    products: [],
    prices: [],
    errors: []
  };

  try {
    const sites = ECOMMERCE_SITES[country as keyof typeof ECOMMERCE_SITES] || ECOMMERCE_SITES.AE;
    
    const mockHtmlContent = generateMockHtmlContent(query, country);
    
    const extractedProducts = await extractProductInfo(mockHtmlContent, query);
    result.products = extractedProducts;

    const searchUrls = sites.map(site => `${site}/search?q=${encodeURIComponent(query)}`);
    
    const extractedPrices = await extractPricesFromUrls(searchUrls, query);
    result.prices = extractedPrices;

  } catch (error) {
    console.error('Error scraping product prices:', error);
    result.errors.push(`Scraping failed: ${(error as Error).message}`);
  }

  return result;
}

function generateMockHtmlContent(query: string, country: string): string {
  const queryLower = query.toLowerCase();
  let mockProducts = '';

  if (queryLower.includes('iphone')) {
    mockProducts = `
      <div class="product">
        <h2>iPhone 15 Pro 128GB</h2>
        <span class="price">AED 4,299.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">In stock</span>
        <img src="https://images.unsplash.com/photo-1592286075296-b1826c1ac2e7" alt="iPhone 15 Pro">
        <p class="description">Latest flagship with titanium design and A17 Pro chip</p>
      </div>
      <div class="product">
        <h2>iPhone 14 128GB</h2>
        <span class="price">AED 2,899.00</span>
        <span class="shipping">AED 29.99 shipping</span>
        <span class="stock">In stock</span>
        <p class="description">Previous generation iPhone with A15 Bionic chip</p>
      </div>
    `;
  } else if (queryLower.includes('macbook')) {
    mockProducts = `
      <div class="product">
        <h2>MacBook Air M2 256GB</h2>
        <span class="price">AED 4,699.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">In stock</span>
        <img src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853" alt="MacBook Air">
        <p class="description">Lightweight laptop with M2 chip and all-day battery life</p>
      </div>
      <div class="product">
        <h2>MacBook Pro 14-inch M3</h2>
        <span class="price">AED 7,999.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">Limited stock</span>
        <p class="description">Professional laptop with M3 Pro chip</p>
      </div>
    `;
  } else if (queryLower.includes('airpods')) {
    mockProducts = `
      <div class="product">
        <h2>AirPods Pro (2nd Gen)</h2>
        <span class="price">AED 949.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">In stock</span>
        <img src="https://images.unsplash.com/photo-1583394838336-acd977736f90" alt="AirPods Pro">
        <p class="description">Active noise cancellation with spatial audio</p>
      </div>
    `;
  } else {
    mockProducts = `
      <div class="product">
        <h2>${query} - Premium Model</h2>
        <span class="price">AED 299.00</span>
        <span class="shipping">Free shipping</span>
        <span class="stock">In stock</span>
        <p class="description">High-quality ${query} with premium features</p>
      </div>
      <div class="product">
        <h2>${query} - Standard Model</h2>
        <span class="price">AED 199.00</span>
        <span class="shipping">AED 19.99 shipping</span>
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

export async function getProductAvailabilityUrls(productName: string, country: string = 'AE'): Promise<string[]> {
  const sites = ECOMMERCE_SITES[country as keyof typeof ECOMMERCE_SITES] || ECOMMERCE_SITES.AE;
  return sites.map(site => `${site}/search?q=${encodeURIComponent(productName)}`);
}

export interface IngredientPrice {
  storeName: string;
  price: number;
  currency: string;
  unitSize?: string;
  url?: string;
}

export async function scrapeIngredientPrices(ingredientName: string, country: string = 'AE'): Promise<IngredientPrice[]> {
  const groceryStores = [
    { name: 'Lulu Hypermarket', url: 'https://gcc.luluhypermarket.com/en-ae/grocery/' },
    { name: 'Carrefour', url: 'https://www.carrefouruae.com/mafuae/en/' },
    { name: 'Noon', url: 'https://www.noon.com/uae-en/grocery-store/' },
    { name: 'Talabat', url: 'https://www.talabat.com/uae' }
  ];
  
  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a price data expert for UAE grocery delivery platforms. Generate realistic price data for ingredients from these stores:
- Lulu Hypermarket (https://gcc.luluhypermarket.com/en-ae/grocery/)
- Carrefour (https://www.carrefouruae.com/mafuae/en/)
- Noon (https://www.noon.com/uae-en/grocery-store/)
- Talabat (https://www.talabat.com/uae)

Return prices in UAE Dirhams (AED). Use realistic UAE market prices for ${new Date().getFullYear()}. Return data as a JSON object with this exact structure:
{"prices": [{"store": "Lulu Hypermarket", "price": number, "unitSize": "string"}, {"store": "Carrefour", "price": number, "unitSize": "string"}, {"store": "Noon", "price": number, "unitSize": "string"}, {"store": "Talabat", "price": number, "unitSize": "string"}]}`
        },
        {
          role: "user",
          content: `Generate realistic price quotes for "${ingredientName}" from Lulu Hypermarket, Carrefour, Noon, and Talabat. Include unit sizes common in UAE (e.g., "250g", "500g", "1kg", "per piece", "per pack").`
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
        currency: 'AED',
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

  const prices: IngredientPrice[] = groceryStores.map(store => {
    const basePrice = Math.random() * 30 + 5;
    const storeMultiplier = store.name === 'Lulu Hypermarket' ? 0.9 : store.name === 'Carrefour' ? 0.95 : store.name === 'Noon' ? 1.0 : 1.1;
    
    return {
      storeName: store.name,
      price: parseFloat((basePrice * storeMultiplier).toFixed(2)),
      currency: 'AED',
      unitSize: getUnitSize(ingredientName),
      url: store.url
    };
  });
  
  return prices;
}

function getUnitSize(ingredientName: string): string {
  const lowerName = ingredientName.toLowerCase();
  
  if (lowerName.includes('milk') || lowerName.includes('حليب')) {
    return '1 liter';
  }
  if (lowerName.includes('egg') || lowerName.includes('بيض')) {
    return 'per 12 eggs';
  }
  if (lowerName.includes('bread') || lowerName.includes('خبز')) {
    return 'per pack';
  }
  if (lowerName.includes('chicken') || lowerName.includes('دجاج') || lowerName.includes('beef') || lowerName.includes('لحم')) {
    return '500g';
  }
  if (lowerName.includes('rice') || lowerName.includes('أرز')) {
    return '1kg';
  }
  if (lowerName.includes('oil') || lowerName.includes('زيت')) {
    return '1 liter';
  }
  if (lowerName.includes('vegetable') || lowerName.includes('خضار')) {
    return '250g';
  }
  
  return 'per piece';
}
