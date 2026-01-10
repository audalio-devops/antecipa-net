# AntecipaNET - Receivables Calculation System

## Overview

AntecipaNET is a financial receivables calculation and simulation platform for Brazilian factoring, securitization, and investment fund (FIDC) operations. The system calculates discounts, taxes, and fees for receivable anticipation across different operation models, allowing users to compare scenarios side-by-side.

The application enables:
- Configuration of multiple calculation models (Factoring, Securitizadora, FIDC)
- Setting financial rates, taxes (IOF, PIS, COFINS, ISS, IR, CSLL), and custom tariffs
- Simulating receivable anticipation with detailed cost breakdowns
- Comparing multiple models simultaneously for decision-making

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Charts**: Recharts for financial data visualization
- **Forms**: React Hook Form with Zod validation

The frontend follows a page-based structure with shared components:
- `client/src/pages/` - Route pages (Dashboard, Simulator, Settings)
- `client/src/components/` - Reusable components and UI primitives
- `client/src/hooks/` - Custom React hooks for data fetching

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build Tool**: Vite for frontend, esbuild for server bundling
- **API Pattern**: REST endpoints defined in `shared/routes.ts`

The server uses a layered architecture:
- `server/routes.ts` - API endpoints and calculation engine
- `server/storage.ts` - Database abstraction layer
- `server/db.ts` - Drizzle ORM connection

### Calculation Engine
Located in `server/routes.ts`, the engine computes:
1. Financial discount (simple or compound interest)
2. Ad valorem fees
3. Tax calculations (IOF, PIS/COFINS, ISS, IR/CSLL)
4. Custom tariffs per model

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` using Drizzle's table builders
- **Migrations**: Managed via `drizzle-kit push`

Key database tables:
- `model_configs` - Operation model configurations with rates and tax settings
- `tariffs` - Custom fees attached to each model
- `simulations` - Saved calculation results

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Database schema and Zod validation schemas
- `routes.ts` - API route definitions with type-safe contracts

## External Dependencies

### Database
- **PostgreSQL** - Primary database (connection via `DATABASE_URL` environment variable)
- **Drizzle ORM** - Type-safe database queries and schema management

### UI Framework
- **Radix UI** - Unstyled accessible component primitives
- **shadcn/ui** - Pre-built component patterns using Radix

### Build & Development
- **Vite** - Frontend development server and bundler
- **esbuild** - Server-side bundling for production
- **tsx** - TypeScript execution for development

### Key Libraries
- **@tanstack/react-query** - Async state management
- **date-fns** - Date manipulation for financial calculations
- **zod** - Schema validation (shared between client/server)
- **recharts** - Chart components for financial visualizations
- **react-hook-form** - Form state management

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` - Error overlay for development
- `@replit/vite-plugin-cartographer` - Development tooling
- `connect-pg-simple` - PostgreSQL session storage (available but may not be active)