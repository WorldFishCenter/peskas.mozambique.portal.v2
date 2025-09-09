# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a Turborepo monorepo with multiple Next.js applications. Use these commands:

**Development:**
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start all apps in development mode
- `pnpm run iso:dev` - Run only the main isomorphic app
- `pnpm run starter:dev` - Run only the starter app
- `pnpm run i18n:dev` - Run only the i18n app

**Build & Production:**
- `pnpm run build` - Build all apps
- `pnpm run start` - Start all apps in production
- `pnpm run iso:build` && `pnpm run iso:start` - Build and run main app only

**Linting:**
- `pnpm run lint` - Lint all apps
- `pnpm run iso:lint` - Lint main app only

**Cleanup:**
- `pnpm run clean` - Clean build artifacts and node_modules

## Architecture Overview

### Monorepo Structure
- **apps/isomorphic/** - Main dashboard application (Peskas Mozambique fisheries dashboard)
- **apps/isomorphic-i18n/** - Internationalized version
- **apps/isomorphic-starter/** - Minimal starter template
- **packages/api/** - tRPC API layer with routers for fisheries data
- **packages/nosql/** - MongoDB schemas and migrations for fisheries data
- **packages/isomorphic-core/** - Shared UI components and utilities
- **packages/config-tailwind/** - Shared Tailwind configuration
- **packages/config-typescript/** - TypeScript configurations

### Technology Stack
- **Framework:** Next.js 14+ with App Router
- **Build System:** Turborepo for monorepo management
- **Package Manager:** pnpm 9.1.4
- **Styling:** Tailwind CSS with multiple layout themes
- **Database:** MongoDB with custom schemas
- **API:** tRPC for type-safe API communication
- **Authentication:** NextAuth.js integration
- **UI Components:** Custom component library in isomorphic-core

### Key Application Features
The main isomorphic app is a fisheries dashboard with:
- Multiple dashboard layouts (Hydrogen, Carbon, Beryllium, etc.)
- File management system with storage analytics
- Data visualization for fisheries statistics
- Multi-language support (i18n version)
- Authentication and user management
- Export functionality for data

### Database Schema
Key collections in nosql package:
- `individual-data.ts` - Individual fisheries catch records
- `catch-monthly.ts` - Monthly aggregated catch data
- `district-summary.ts` - District-level summaries
- `gear-summary.ts` - Fishing gear statistics
- `bmu.ts` - Beach Management Unit data

### API Architecture
tRPC routers in packages/api:
- `aggregated-catch.ts` - Catch aggregation endpoints
- `fish-distribution.ts` - Fish distribution data
- `monthly-stats.ts` - Monthly statistics
- `map-distribution.ts` - Geographic distribution data
- `gear.ts` - Fishing gear data
- `district-summary.ts` - District summary endpoints

### Layout System
Multiple pre-built layout themes:
- **Hydrogen** - Default dashboard layout
- **Carbon** - Alternative sidebar layout
- **Beryllium** - Fixed sidebar layout
- **Helium/Lithium/Boron** - Additional layout variations

Each layout includes header, sidebar, and responsive navigation components.

### Environment Variables
Required for build (defined in turbo.json):
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXTAUTH_URL` - NextAuth URL
- `MONGODB_URI` - MongoDB connection string
- `VERCEL_URL` - Vercel deployment URL (optional)

## Development Notes

### Working with the Main App
- Main dashboard code is in `apps/isomorphic/src/app/(hydrogen)/`
- Shared components are in `packages/isomorphic-core/src/components/`
- API routes are in `packages/api/src/router/`
- Database schemas are in `packages/nosql/src/schema/`

### Adding New Features
1. Add API endpoints in `packages/api/src/router/`
2. Create/update database schemas in `packages/nosql/src/schema/`
3. Build UI components in `packages/isomorphic-core/src/components/`
4. Implement pages in the appropriate app directory

### Code Organization
- Follow existing patterns for file structure and naming
- Components use Tailwind CSS for styling
- TypeScript is used throughout with strict typing
- tRPC provides end-to-end type safety

### Database Migrations
- Migration files are in `packages/nosql/migrations/`
- Use the migration system for schema changes
- Test with `packages/nosql/src/test-monthly.ts`
- Commands: `pnpm run generate` (create migration), `pnpm run migrate` (run migrations)

### Testing & Quality
- **Linting:** Uses ESLint with Next.js configuration
- **Formatting:** Prettier with Tailwind CSS plugin
- **Type Checking:** TypeScript strict mode throughout
- Run `pnpm run lint` and `pnpm run format` in individual apps or globally

### Key Dependencies
- **UI Library:** RizzUI custom component system
- **State Management:** Jotai for atomic state management
- **Forms:** React Hook Form with validation
- **Charts:** Recharts for data visualization
- **Drag & Drop:** @dnd-kit for interactive components
- **Icons:** Lucide React and Tabler Icons