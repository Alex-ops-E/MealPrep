# PriceWise - AI-Powered Product Price Comparison Platform

## Overview

PriceWise is a modern web application that helps users find the best prices for products across multiple retailers. The platform combines AI-powered product categorization and price extraction with real-time web scraping to provide comprehensive price comparisons. Users can search for products, view price history, set up price alerts, and compare offerings from different stores in various countries.

The application follows a full-stack TypeScript architecture with a React frontend and Express.js backend, utilizing AI services for intelligent product analysis and data extraction from e-commerce websites.

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
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL for scalable cloud hosting
- **Session Management**: PostgreSQL session store with connect-pg-simple
- **API Design**: RESTful endpoints with structured error handling and request logging

### Data Storage Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect for database schema management
- **Schema Design**: Normalized relational structure with tables for products, stores, prices, alerts, and search queries
- **In-Memory Fallback**: MemStorage class implements the same interface as database storage for development/testing
- **Migrations**: Drizzle Kit for database schema migrations and version control

### AI Integration Architecture
- **Service**: OpenAI GPT integration for product categorization and data extraction
- **Product Analysis**: AI-powered categorization of products based on names and descriptions
- **Price Extraction**: Intelligent parsing of HTML content to extract product information and pricing data
- **Web Scraping**: Mock scraping service that simulates data extraction from major e-commerce platforms

### Development Architecture
- **Development Server**: Vite dev server with HMR (Hot Module Replacement)
- **Production Build**: Static asset generation with Express.js serving both API and static files
- **Path Aliases**: TypeScript path mapping for clean imports (@/, @shared/)
- **Code Quality**: TypeScript strict mode with comprehensive type checking

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database driver for Neon cloud platform
- **drizzle-orm**: Type-safe ORM with PostgreSQL support and schema validation
- **express**: Web application framework for the backend API server
- **react**: Frontend UI library with hooks and modern patterns
- **wouter**: Minimalist routing library for React applications

### UI and Styling Dependencies
- **@radix-ui/***: Collection of low-level UI primitives for accessible component development
- **tailwindcss**: Utility-first CSS framework with custom design system variables
- **class-variance-authority**: Utility for creating variant-based component styles
- **lucide-react**: Icon library with consistent SVG icons

### Data Management Dependencies
- **@tanstack/react-query**: Server state management with caching, background updates, and optimistic updates
- **react-hook-form**: Form management with validation and performance optimization
- **@hookform/resolvers**: Integration layer for form validation schemas
- **zod**: TypeScript-first schema validation for runtime type checking

### Development and Build Dependencies
- **vite**: Modern build tool with fast development server and optimized production builds
- **typescript**: Static type checking and enhanced developer experience
- **drizzle-kit**: Database migration and schema management tool
- **esbuild**: Fast JavaScript bundler for server-side code compilation

### Third-Party Service Integrations
- **OpenAI API**: AI service for product categorization and intelligent data extraction from web content
- **Multiple E-commerce APIs**: Integration points for major retailers (Amazon, Best Buy, Target, etc.) across different countries
- **Web Scraping Infrastructure**: Simulated scraping services for extracting product data from retailer websites

The application is designed to be easily deployable on cloud platforms with environment-based configuration for database connections, API keys, and service endpoints.