# Grocery Agent - AI-Powered Recipe Generator & Shopping Assistant

## Overview

Grocery Agent is a modern web application that helps users discover recipes, generate shopping lists, and compare ingredient prices across different stores. The platform combines AI-powered recipe generation with real-time ingredient price comparison to provide a comprehensive cooking and shopping experience.

The application follows a full-stack TypeScript architecture with a React frontend and Express.js backend, utilizing OpenAI for intelligent recipe generation and price extraction from grocery stores.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight, hook-based routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Storage**: In-memory storage using MemStorage class for development
- **API Design**: RESTful endpoints with structured error handling and request logging
- **AI Integration**: OpenAI GPT-5 for recipe generation and ingredient analysis

### Data Storage Architecture
- **Storage Pattern**: IStorage interface with MemStorage implementation
- **Schema Design**: Simple relational structure with recipes, shopping lists, stores, and price quotes
- **In-Memory Storage**: MemStorage class for fast development and testing

### AI Integration Architecture
- **Service**: OpenAI GPT-5 integration for recipe generation
- **Recipe Generation**: AI-powered recipe creation based on user preferences (cravings, servings, cuisine, dietary restrictions)
- **Price Extraction**: Simulated price scraping for grocery ingredients across multiple stores

### Development Architecture
- **Development Server**: Vite dev server with HMR (Hot Module Replacement)
- **Production Build**: Static asset generation with Express.js serving both API and static files
- **Path Aliases**: TypeScript path mapping for clean imports (@/, @shared/)
- **Code Quality**: TypeScript strict mode with comprehensive type checking

## Key Features

### 1. Recipe Generator (4-Step Wizard)
- **Step 1: Generate** - Users describe their craving and select preferences (servings, cuisine, cooking time, dietary restrictions)
- **Step 2: View Recipe** - Display generated recipe with ingredients, instructions, and cooking details
- **Step 3: Shop** - Create shopping list from recipe ingredients
- **Step 4: Compare** - Compare ingredient prices across different grocery stores

### 2. Recipe Generation
- AI-powered recipe creation using OpenAI GPT-5
- Quick start templates (Healthy & Quick, Comfort Food, Date Night, Family Dinner)
- Customizable preferences (servings, cuisine style, cooking time)
- Dietary restriction support (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Keto)

### 3. Shopping List Management
- Automatic shopping list generation from recipes
- Ingredient quantity and unit tracking
- Item acquisition status tracking

### 4. Price Comparison
- Ingredient price comparison across multiple stores
- Store information with ratings
- Price quotes with unit sizes

## Data Model

### Core Entities

**Recipes**
- title: Recipe name
- summary: Brief description
- servings: Number of servings
- cuisine: Cuisine style
- cookTime: Estimated cooking time
- dietaryTags: Dietary restrictions/preferences
- ingredients: List of ingredients with quantities
- steps: Cooking instructions

**Shopping Lists**
- recipeId: Associated recipe
- status: List status (pending, completed)
- items: Shopping list items

**Shopping List Items**
- ingredientName: Name of ingredient
- quantity: Amount needed
- unit: Measurement unit
- acquired: Purchase status

**Stores**
- name: Store name
- logo: Store logo URL
- website: Store website
- country: Store location
- rating: Customer rating

**Price Quotes**
- ingredientName: Ingredient being priced
- storeId: Associated store
- price: Current price
- unitSize: Package size
- currency: Price currency
- url: Product URL

## External Dependencies

### Core Framework Dependencies
- **express**: Web application framework for the backend API server
- **react**: Frontend UI library with hooks and modern patterns
- **wouter**: Minimalist routing library for React applications

### UI and Styling Dependencies
- **@radix-ui/***: Collection of low-level UI primitives for accessible component development
- **tailwindcss**: Utility-first CSS framework with custom design system variables
- **class-variance-authority**: Utility for creating variant-based component styles
- **lucide-react**: Icon library with consistent SVG icons

### Data Management Dependencies
- **@tanstack/react-query**: Server state management with caching and optimistic updates
- **react-hook-form**: Form management with validation and performance optimization
- **@hookform/resolvers**: Integration layer for form validation schemas
- **zod**: TypeScript-first schema validation for runtime type checking

### Development and Build Dependencies
- **vite**: Modern build tool with fast development server and optimized production builds
- **typescript**: Static type checking and enhanced developer experience
- **esbuild**: Fast JavaScript bundler for server-side code compilation

### Third-Party Service Integrations
- **OpenAI API**: AI service for recipe generation and intelligent ingredient analysis
- **Simulated Grocery Store APIs**: Mock price data for multiple Indonesian grocery platforms (Grab Food, Gojek GoFood, Superindo)

## API Endpoints

### Recipe Endpoints
- `POST /api/recipes/generate` - Generate new recipe with AI
- `GET /api/recipes/:id` - Get recipe details
- `GET /api/recipes` - Get all recipes

### Shopping List Endpoints
- `POST /api/shopping-lists` - Create shopping list
- `GET /api/shopping-lists/:id` - Get shopping list with items
- `GET /api/shopping-lists/recipe/:recipeId` - Get shopping list by recipe
- `POST /api/shopping-lists/:id/items` - Add item to shopping list
- `PATCH /api/shopping-list-items/:id` - Update shopping list item

### Price & Store Endpoints
- `GET /api/ingredients/:name/prices` - Get ingredient price quotes
- `GET /api/stores` - Get all stores

## Application Flow

1. **Recipe Generation**
   - User enters craving description or selects quick start
   - User customizes servings, cuisine, cooking time, and dietary restrictions
   - AI generates personalized recipe with ingredients and instructions

2. **Recipe Review**
   - User views generated recipe with ingredients and steps
   - User can generate another recipe or proceed to shopping

3. **Shopping List**
   - System creates shopping list from recipe ingredients
   - User can mark items as acquired
   - User proceeds to price comparison

4. **Price Comparison**
   - System fetches prices for ingredients from multiple stores
   - User can compare prices and choose where to shop

The application is designed for easy deployment on cloud platforms with environment-based configuration for API keys and service endpoints.
