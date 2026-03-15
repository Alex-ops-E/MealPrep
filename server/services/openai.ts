import OpenAI from "openai";
import type { GenerateRecipeParams, GenerateMealParams, InsertRecipe, Ingredient } from "@shared/schema";

export interface NutritionInfo {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

export interface ExtractedProductInfo {
  name: string;
  price: number;
  currency: string;
  description?: string;
  imageUrl?: string;
  inStock: boolean;
  shipping?: number;
  specifications?: Record<string, any>;
}

export interface ExtractedPriceInfo {
  storeName: string;
  price: number;
  currency: string;
  inStock: boolean;
  shipping?: number;
  url: string;
}

export async function extractProductInfo(htmlContent: string, productQuery: string): Promise<ExtractedProductInfo[]> {
  try {
    console.log(`GPT extracting products for query: "${productQuery}"`);
    console.log(`HTML content length: ${htmlContent.length}`);
    
    const prompt = `
You are a product information extraction expert. Extract product details from the following HTML content for products matching the query: "${productQuery}".

HTML Content:
${htmlContent.slice(0, 8000)} // Limit content size

Please extract and return a JSON array of products with the following structure:
{
  "products": [
    {
      "name": "Product name",
      "price": 99.99,
      "currency": "USD",
      "description": "Product description",
      "imageUrl": "URL to product image",
      "inStock": true,
      "shipping": 0,
      "specifications": {
        "key": "value"
      }
    }
  ]
}

Focus on:
1. Exact product names and prices
2. Stock status
3. Shipping costs (0 for free shipping)
4. Product descriptions and specifications
5. Image URLs if available

Return only valid JSON. If no products found, return empty array.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a specialized product data extraction AI. Extract accurate product information from HTML and return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"products": []}');
    console.log(`GPT extracted ${(result.products || []).length} products`);
    return result.products || [];
  } catch (error) {
    console.error("Error extracting product info:", error);
    throw new Error("Failed to extract product information: " + (error as Error).message);
  }
}

export async function extractPricesFromUrls(urls: string[], productQuery: string): Promise<ExtractedPriceInfo[]> {
  try {
    const urlsText = urls.join('\n');
    
    const prompt = `
You are a price comparison expert. For the product query "${productQuery}", analyze these e-commerce URLs and extract pricing information:

URLs to analyze:
${urlsText}

For each URL that contains relevant product information, extract:
1. Store/retailer name
2. Product price
3. Currency
4. Stock status
5. Shipping cost
6. The URL

Return JSON in this format:
{
  "prices": [
    {
      "storeName": "Store Name",
      "price": 99.99,
      "currency": "USD",
      "inStock": true,
      "shipping": 15.99,
      "url": "https://example.com/product"
    }
  ]
}

Focus on finding exact matches for the product query. If a URL doesn't contain relevant product information, skip it.
Return only valid JSON.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a price extraction specialist. Analyze URLs and extract accurate pricing information for product comparison."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"prices": []}');
    return result.prices || [];
  } catch (error) {
    console.error("Error extracting prices from URLs:", error);
    throw new Error("Failed to extract prices: " + (error as Error).message);
  }
}

export async function categorizeProduct(productName: string, description?: string): Promise<string> {
  try {
    const prompt = `
Categorize the following product into one of these categories:
- Electronics
- Fashion
- Home & Garden
- Sports
- Books
- Health & Beauty
- Automotive
- Toys & Games
- Other

Product: ${productName}
Description: ${description || "No description provided"}

Return only the category name.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a product categorization expert. Categorize products accurately based on their name and description."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content?.trim() || "Other";
  } catch (error) {
    console.error("Error categorizing product:", error);
    return "Other";
  }
}

export async function generateRecipe(params: GenerateRecipeParams): Promise<InsertRecipe> {
  try {
    const { craving, servings, cuisine, cookTime, dietaryRestrictions } = params;
    
    const dietaryInfo = dietaryRestrictions && dietaryRestrictions.length > 0
      ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}`
      : 'No dietary restrictions';
    
    const cuisineInfo = cuisine && cuisine !== 'Any' ? `Cuisine style: ${cuisine}` : '';
    const timeInfo = cookTime && cookTime !== 'Any' ? `Cooking time: ${cookTime}` : '';
    
    const prompt = `
Generate a detailed recipe based on the following requirements:

Craving: ${craving}
Servings: ${servings}
${cuisineInfo}
${timeInfo}
${dietaryInfo}

Please create a complete recipe with:
1. A creative and appetizing title
2. A brief summary (2-3 sentences)
3. A detailed list of ingredients with quantities and units
4. Step-by-step cooking instructions
5. Total estimated cooking time

Return the recipe in the following JSON format:
{
  "title": "Recipe Title",
  "summary": "Brief description of the dish",
  "servings": ${servings},
  "cuisine": "${cuisine || 'Various'}",
  "cookTime": "30 minutes",
  "dietaryTags": ${JSON.stringify(dietaryRestrictions || [])},
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 1.5,
      "unit": "cups"
    }
  ],
  "steps": [
    "Step 1 instruction",
    "Step 2 instruction"
  ]
}

Make sure the recipe is practical, delicious, and matches the specified requirements.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a professional chef and recipe creator. Generate detailed, practical, and delicious recipes that match user preferences."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      title: result.title,
      summary: result.summary,
      servings: result.servings,
      cuisine: result.cuisine,
      cookTime: result.cookTime,
      dietaryTags: result.dietaryTags,
      ingredients: result.ingredients,
      steps: result.steps
    };
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw new Error("Failed to generate recipe: " + (error as Error).message);
  }
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
export async function analyzeNutritionFromImage(base64Image: string): Promise<NutritionInfo> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a nutrition analysis expert. Analyze food images and estimate the nutritional content based on visual inspection. Provide realistic estimates for a typical serving size shown in the image."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image and estimate the nutritional content. Return JSON with:
{
  "name": "Name of the food/dish",
  "calories": estimated total calories (number),
  "protein": estimated grams of protein (number),
  "carbs": estimated grams of carbohydrates (number),
  "fat": estimated grams of fat (number)
}

Be realistic with estimates based on the visible portion size. If multiple items are present, sum them together.`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      name: result.name || "Unknown Food",
      calories: Math.round(result.calories || 0),
      protein: Math.round(result.protein || 0),
      carbs: Math.round(result.carbs || 0),
      fat: Math.round(result.fat || 0),
    };
  } catch (error) {
    console.error("Error analyzing nutrition from image:", error);
    throw new Error("Failed to analyze food image: " + (error as Error).message);
  }
}

export interface FridgeScanResult {
  ingredients: string[];
  recipe: InsertRecipe;
}

export async function analyzeFridgeAndGenerateRecipe(base64Image: string): Promise<FridgeScanResult> {
  const recognitionResponse = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an expert chef who can identify ingredients from photos of fridges, pantries, or ingredient layouts. Be thorough but practical — only list ingredients that are clearly visible and usable."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Look at this image and identify all visible food ingredients. Return a JSON object like:
{
  "ingredients": ["ingredient1", "ingredient2", "ingredient3"]
}
List only ingredients you can clearly see. Be specific (e.g. "chicken breast" not just "meat").`
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image.startsWith("data:") ? base64Image : `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1024
  });

  const recognized = JSON.parse(recognitionResponse.choices[0].message.content || '{"ingredients":[]}');
  const ingredients: string[] = recognized.ingredients || [];

  if (ingredients.length === 0) {
    throw new Error("No ingredients detected in the image");
  }

  const ingredientList = ingredients.join(", ");

  const recipeResponse = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are a professional chef. Create practical, delicious recipes using the available ingredients."
      },
      {
        role: "user",
        content: `I have these ingredients: ${ingredientList}. Create the best possible recipe using mainly these ingredients. You may assume basic pantry staples (salt, pepper, oil, water) are available.

Return JSON in this exact format:
{
  "title": "Recipe Title",
  "summary": "Brief description",
  "servings": 2,
  "cuisine": "cuisine type",
  "cookTime": "30 minutes",
  "dietaryTags": [],
  "ingredients": [
    { "name": "ingredient name", "quantity": 1.5, "unit": "cups" }
  ],
  "steps": ["Step 1", "Step 2"]
}`
      }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2048
  });

  const recipeData = JSON.parse(recipeResponse.choices[0].message.content || '{}');

  const recipe: InsertRecipe = {
    title: recipeData.title,
    summary: recipeData.summary,
    servings: recipeData.servings || 2,
    cuisine: recipeData.cuisine || "Various",
    cookTime: recipeData.cookTime || "30 minutes",
    dietaryTags: recipeData.dietaryTags || [],
    ingredients: recipeData.ingredients || [],
    steps: recipeData.steps || []
  };

  return { ingredients, recipe };
}

export async function generateMeal(params: GenerateMealParams): Promise<InsertRecipe> {
  try {
    const { prompt, type, servings } = params;
    
    const mealTypeContext = {
      breakfast: "a breakfast dish that's energizing and nutritious",
      lunch: "a lunch dish that's satisfying and balanced",
      dinner: "a dinner dish that's hearty and delicious"
    };
    
    const fullPrompt = `
Generate a detailed recipe for ${mealTypeContext[type]}.

User's Request: ${prompt}
Servings: ${servings}
Meal Type: ${type}

Please create a complete recipe with:
1. A creative and appetizing title suitable for ${type}
2. A brief summary (2-3 sentences)
3. Preparation time estimate
4. Difficulty level (Easy, Medium, or Hard)
5. A detailed list of ingredients with quantities and units
6. Step-by-step cooking instructions
7. Chef's tips for best results
8. Total estimated cooking time

Return the recipe in the following JSON format:
{
  "title": "Recipe Title",
  "summary": "Brief description of the dish",
  "prepTime": "15 minutes",
  "servings": ${servings},
  "cookTime": "30 minutes",
  "difficulty": "Easy",
  "cuisine": "American",
  "dietaryTags": [],
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 1.5,
      "unit": "cups"
    }
  ],
  "steps": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "chefsTips": "Helpful tips for preparing this dish"
}

Make sure the recipe is practical, delicious, and perfect for ${type}.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a professional chef specializing in meal planning. Generate detailed, practical, and delicious recipes for specific meal types (breakfast, lunch, dinner)."
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      title: result.title,
      summary: result.summary,
      prepTime: result.prepTime,
      servings: result.servings,
      cuisine: result.cuisine || 'Various',
      cookTime: result.cookTime,
      difficulty: result.difficulty,
      dietaryTags: result.dietaryTags || [],
      ingredients: result.ingredients,
      steps: result.steps,
      chefsTips: result.chefsTips
    };
  } catch (error) {
    console.error("Error generating meal:", error);
    throw new Error("Failed to generate meal: " + (error as Error).message);
  }
}
