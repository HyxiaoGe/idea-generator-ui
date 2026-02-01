# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Image Video Generator (AI创作工坊) - A React-based web UI for AI image and video generation. The main application code is in the `/Aiimagevideogenerator/` directory.

## Commands

All commands should be run from `/Aiimagevideogenerator/`:

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Production build
pnpm build
```

No test framework is currently configured.

## Architecture

### Tech Stack
- **Framework**: React 18.3.1 + TypeScript
- **Build**: Vite 6.3.5
- **Styling**: Tailwind CSS 4.1.12 (using Vite plugin)
- **UI Components**: Radix UI primitives (20+ components)
- **Animation**: Motion (Framer Motion alternative)
- **Forms**: React Hook Form
- **Notifications**: Sonner (toast)

### Source Structure (`/Aiimagevideogenerator/src/`)

```
app/
├── App.tsx                 # Main app with useState-based routing (12 pages)
├── contexts/
│   └── ThemeContext.tsx    # Light/dark theme with localStorage persistence
├── components/
│   ├── HomePage.tsx        # Image/video generation
│   ├── ChatPage.tsx        # Multi-turn conversation refinement
│   ├── StylePage.tsx       # Style transfer
│   ├── BlendPage.tsx       # Image blending
│   ├── ImageToVideoPage.tsx
│   ├── GalleryPage.tsx     # Masonry gallery with filtering
│   ├── TemplatesPage.tsx   # Template library
│   ├── SettingsPage.tsx    # Settings + documentation links
│   ├── Navigation.tsx      # Top nav bar
│   ├── ui/                 # Radix UI component wrappers
│   └── skeletons/          # Skeleton loading components
└── lib/
    └── utils.ts            # cn() utility for class merging

styles/
├── index.css               # Main entry
├── theme.css               # CSS variables for light/dark themes
└── tailwind.css            # Tailwind directives
```

### Routing

Uses `useState<Page>` in App.tsx rather than a router library. Pages: `home`, `chat`, `style`, `blend`, `image-to-video`, `gallery`, `templates`, `settings`, `generating-demo`, `design-system`, `components`, `pages-overview`.

Navigation is handled via `onNavigate` callback props passed to page components.

### Path Alias

`@` is aliased to `./src` in vite.config.ts.

## Design System

### Colors (Dark Theme - Default)
- Background: `#09090B` / `#18181B` / `#27272A`
- Primary gradient: `linear-gradient(135deg, #7C3AED, #2563EB)`
- Success: `#10B981`, Warning: `#F59E0B`, Error: `#EF4444`
- Text: `#FAFAFA` (primary), `#A1A1AA` (secondary)
- Border: `#3F3F46`

### Border Radius
- 8px: Buttons, inputs
- 12px: Cards
- 16px: Large cards, modals

### Spacing
4px grid system (xs: 4px, sm: 8px, md: 12px, base: 16px, lg: 24px)

## Notes

- **No backend API yet** - UI is complete but needs AI generation API integration
- **Chinese UI** - Interface text is in Chinese
- **Double-click logo** to access generating animation demo page
