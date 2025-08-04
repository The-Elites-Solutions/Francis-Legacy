# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a **Vite + React** project (not Next.js) with TypeScript, shadcn/ui components, and Tailwind CSS for a family heritage website.

### Core Development Commands
```bash
# Install dependencies (use pnpm as it has a lock file)
pnpm install

# Start development server (Vite)
pnpm run dev

# Build for production (Vite)
pnpm run build

# Preview production build
pnpm run preview

# Run linting (ESLint on src/ directory only)
pnpm run lint
```

### shadcn/ui Component Management
All shadcn/ui components are pre-installed in `src/components/ui/`. The project uses shadcn/ui configuration located in `components.json`. Over 40 components are available including dialogs, forms, navigation, data display, and feedback components.

## Architecture Overview

### Primary Technology Stack
- **Vite** as build tool with React SWC plugin
- **React 18** with React Router DOM for client-side routing
- **TypeScript** with relaxed configuration (allows JS, no strict null checks)
- **Tailwind CSS** with extensive custom theme system
- **shadcn/ui** complete component library (Radix UI + Tailwind)
- **Supabase** for backend services
- **TanStack Query** for data fetching
- **Lucide React** for icons

### Project Structure
This is a **hybrid codebase** with a Vite/React primary application and Next.js artifacts:

- **Primary App**: Vite + React in `/src` directory (active development)
- **Next.js Structure**: `/app` directory contains Next.js App Router files (appears to be legacy/alternative implementation)
- **Shared Components**: shadcn/ui components used by both structures

### Key Architectural Patterns

1. **Path Aliases**: The `@/` alias points to the `src/` directory (configured in vite.config.ts)
2. **Dual Theme Providers**: Custom theme provider (`src/components/theme-provider.tsx`) and next-themes wrapper
3. **Family Heritage Context**: All content focuses on family history, genealogy, and heritage preservation
4. **Component Library**: Complete shadcn/ui ecosystem with consistent Radix UI + Tailwind patterns
5. **Responsive Design**: Mobile-first approach with extensive breakpoint handling

### Directory Structure
```
src/                           # Primary Vite + React application
├── main.tsx                  # Application entry point
├── App.tsx                   # Root component with router
├── index.css                 # Global styles with CSS variables
├── components/
│   ├── ui/                   # Complete shadcn/ui library (40+ components)
│   ├── layout/               # Navigation, Footer, Layout components
│   ├── theme-provider.tsx    # Custom theme management
│   └── providers.tsx         # Application providers
├── pages/                    # React Router pages
│   ├── Home.tsx             # Landing page with hero section
│   ├── FamilyHistory.tsx    # Timeline-based family history
│   ├── FamilyTree.tsx       # Interactive family tree with modal details
│   ├── News.tsx             # Family news and announcements
│   ├── Blog.tsx             # Family stories and articles
│   └── Archives.tsx         # Historical documents and photos
├── hooks/                    # Custom React hooks
└── lib/                      # Utilities (cn function, etc.)

app/                          # Next.js App Router structure (legacy/alternative)
├── layout.tsx               # Next.js root layout
├── page.tsx                 # Next.js home page
├── globals.css              # Duplicate of src/index.css
└── [routes]/                # Next.js route pages
```

### Family Heritage Website Features
This is a comprehensive family heritage and genealogy website with:

- **Interactive Family Tree**: Clickable family members with detailed modal profiles
- **Timeline History**: Chronological family events from 1874 to present
- **Family Statistics**: 127 members, 6 generations, 18 countries, earliest record 1848
- **Archives Section**: Historical documents and photographs
- **News & Blog**: Family updates and story sharing
- **Responsive Design**: Optimized for all devices with touch support

### Theme Implementation
- **CSS Variables**: Extensive theming system with HSL color values
- **Dark Mode**: Enhanced dark theme with brighter colors (recently updated)
- **Typography**: Inter (body) + Playfair Display (headings) for elegant family website aesthetic
- **Color Palette**: Yellow/amber accent colors with sophisticated gray/slate backgrounds
- **Custom Animations**: fade-in, slide-in, animate-in utilities for enhanced UX

### Component Import Patterns
```typescript
// UI components (40+ available)
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'

// Utilities and hooks
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/theme-provider'

// Icons
import { Heart, User, Calendar } from 'lucide-react'
```

### Styling Guidelines
- Use Tailwind CSS classes with `cn()` utility for conditional class merging
- CSS variables pre-configured for consistent theming across light/dark modes
- Responsive breakpoints: mobile-first approach with sm/md/lg/xl/2xl breakpoints
- Touch-optimized interactions for mobile family tree exploration

### Important Configuration Files
- `vite.config.ts`: Vite configuration with path aliases and React SWC
- `tailwind.config.ts`: Comprehensive Tailwind setup with custom theme colors
- `components.json`: shadcn/ui configuration for component management
- `tsconfig.json`: TypeScript configuration with path aliases and relaxed settings
- `package.json`: Vite-based development workflow with ESLint

### Development Notes
- **Active Build System**: Vite (ignore Next.js references in /app directory)
- **Entry Point**: `src/main.tsx` renders to `index.html`
- **Routing**: React Router DOM handles client-side navigation
- **Package Manager**: pnpm (has lock file)
- **Linting**: ESLint configured for src/ directory only
- **Recent Enhancements**: Family tree modal system with improved responsive design and centering