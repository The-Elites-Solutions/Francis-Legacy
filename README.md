# Francis Legacy - Family Heritage Website

A modern family heritage website built with Next.js 14, showcasing family history, archives, and genealogy information.

## Technology Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **React 18** for component architecture
- **shadcn/ui** component library (pre-installed)
- **Tailwind CSS** for styling
- **Radix UI** primitives
- **Lucide React** icons
- **next-themes** for theme management

## Features

- 🏠 **Family Heritage Homepage** - Welcome and overview
- 📚 **Family History** - Detailed historical narratives
- 🌳 **Family Tree** - Interactive genealogy visualization
- 📰 **News & Updates** - Latest family announcements
- 📖 **Blog** - Family stories and articles
- 🗃️ **Archives** - Historical documents and photos
- 🌙 **Theme Support** - Light, dark, and system themes
- 📱 **Responsive Design** - Mobile-first approach

## Project Structure

This project uses a **dual-structure architecture**:

### Next.js App Router (`/app`)
- Modern Next.js 14 pages and layouts
- Server components and routing
- Global styles and configuration

### React Components (`/src`)
- Reusable UI components
- Custom hooks and utilities
- shadcn/ui component library

```
app/                    # Next.js App Router
├── layout.tsx         # Root layout with theme provider
├── page.tsx          # Homepage
├── family-history/   # Family history page
├── family-tree/      # Family tree page
├── news/            # News page
├── blog/            # Blog page
└── archives/        # Archives page

src/                   # React ecosystem
├── components/
│   ├── ui/           # shadcn/ui components (complete library)
│   ├── layout/       # Navigation, Footer, Layout
│   └── theme-provider.tsx
├── hooks/            # Custom React hooks
├── lib/              # Utilities (cn function, etc.)
└── pages/            # Legacy React pages
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended package manager)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Francis-legacy

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Development Commands

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start

# Run linting
pnpm run lint
```

## Component Usage

### shadcn/ui Components

All shadcn/ui components are pre-installed and ready to use:

```tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'

// Use in your components
<Button variant="outline">Click me</Button>
```

### Styling

- Use Tailwind CSS classes for styling
- Use the `cn()` utility for conditional classes
- CSS variables are pre-configured for theming
- Custom fonts: Inter (body) and Playfair Display (headings)

```tsx
import { cn } from '@/lib/utils'

<div className={cn("base-styles", condition && "conditional-styles")}>
  Content
</div>
```

### Theme Support

The project includes comprehensive theme support:

```tsx
import { useTheme } from '@/components/theme-provider'

const { theme, setTheme } = useTheme()
// Supports: 'light', 'dark', 'system'
```

## Configuration

### Important Files

- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration with path aliases
- `next.config.js` - Next.js configuration

### Path Aliases

The `@/` alias points to the `src/` directory:

```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

## Development Guidelines

1. **Component Structure**: Follow existing patterns in the codebase
2. **Styling**: Use Tailwind CSS classes and the `cn()` utility
3. **TypeScript**: Maintain type safety throughout
4. **Theme Support**: Ensure components work in both light and dark modes
5. **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Deployment

The project is optimized for deployment on:

- **Vercel** (recommended for Next.js)
- **Netlify**
- Any platform supporting Node.js applications

```bash
# Build for production
pnpm run build

# The output will be in the `.next` directory
```

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for all new code
3. Ensure components are accessible and responsive
4. Test in both light and dark themes
5. Run linting before committing: `pnpm run lint`

