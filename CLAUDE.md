# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a Next.js 14 project with TypeScript, shadcn/ui components, and Tailwind CSS.

### Core Development Commands
```bash
# Install dependencies (use pnpm as it has a lock file)
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start

# Run linting
pnpm run lint
```

### shadcn/ui Component Management
All shadcn/ui components are pre-installed in `src/components/ui/`. The project uses shadcn/ui configuration located in `components.json`.

## Architecture Overview

### Project Structure
This is a **dual-structure project** with both Next.js App Router and traditional React components:

- **Next.js App Router**: Located in `/app` directory with pages for family heritage website
- **React Components**: Located in `/src` directory with reusable components and utilities

### Key Architectural Patterns

1. **Path Aliases**: The `@/` alias points to the `src/` directory (configured in tsconfig.json)
2. **Theme System**: Uses next-themes with a custom ThemeProvider supporting light/dark/system modes
3. **Component Library**: Complete shadcn/ui component library pre-installed in `src/components/ui/`
4. **Styling**: Tailwind CSS with CSS variables for theming and custom animations

### Directory Structure
```
app/                    # Next.js App Router pages
├── layout.tsx         # Root layout with theme provider
├── page.tsx          # Home page
├── globals.css       # Global styles
└── [routes]/         # Route-specific pages

src/                   # React components and utilities
├── components/
│   ├── ui/           # shadcn/ui components (pre-installed)
│   ├── layout/       # Layout components (Navigation, Footer)
│   └── theme-provider.tsx
├── hooks/            # Custom React hooks
└── lib/              # Utilities (cn function for class merging)
```

### Theme Implementation
- Uses CSS variables defined in `src/index.css` for consistent theming
- Custom fonts: Inter (body text) and Playfair Display (headings)
- Dark mode support with custom scrollbar styling
- System preference detection with localStorage persistence

### Component Imports
- UI components: `import { Button } from '@/components/ui/button'`
- Utilities: `import { cn } from '@/lib/utils'`
- Custom hooks: `import { useTheme } from '@/components/theme-provider'`

### Styling Guidelines
- Use Tailwind CSS classes for styling
- Use the `cn()` utility function for conditional class merging
- CSS variables are pre-configured for theme colors
- Custom animations are available via utility classes (animate-in, fade-in, etc.)

### Technology Stack
- Next.js 14+ with App Router
- TypeScript
- React 18
- shadcn/ui component library
- Tailwind CSS
- Radix UI primitives
- Lucide React icons
- Next-themes for theme management

### Important Configuration Files
- `components.json`: shadcn/ui configuration
- `tailwind.config.ts`: Tailwind configuration with custom theme colors
- `tsconfig.json`: TypeScript configuration with path aliases
- `next.config.js`: Next.js configuration with experimental app directory