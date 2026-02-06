# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Image Video Generator (AI创作工坊) - A Next.js 15 web UI for AI image and video generation, integrated with the Nano Banana Lab FastAPI backend. Interface text is in Chinese.

### Backend Integration

The frontend connects to a FastAPI backend (Nano Banana Lab) for:

- **Authentication**: GitHub OAuth via Next.js API Routes (token exchange) + direct API calls
- **Image/Video Generation**: Real API calls to `/api/generate`, `/api/generate/batch`, `/api/video/generate`
- **Chat**: Multi-turn sessions via `/api/chat`
- **History/Favorites/Templates**: CRUD via REST API
- **Quota**: Real-time quota tracking via `/api/quota`
- **WebSocket**: Real-time notifications for task progress, generation completion, quota warnings

**Not yet integrated** (kept as mock): Style Transfer (`/style`) and Image Blend (`/blend`) — backend has no dedicated endpoints.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
```

No test framework is currently configured.

## Architecture

### Tech Stack

- **Framework**: Next.js 15.1 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS 4.1 via PostCSS
- **UI Components**: Radix UI primitives (48 wrapped components in `src/components/ui/`)
- **Animation**: Motion (motion/react)
- **Theme**: next-themes with CSS variables (`src/styles/theme.css`)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)
- **Data Fetching**: SWR (stale-while-revalidate)
- **WebSocket**: Custom client with auto-reconnect (`src/lib/ws/`)

### Path Alias

`@` → `./src` (configured in tsconfig.json)

### Routing

Next.js 15 App Router with file-based routing. Pages under `src/app/`:

- `/` — Home: image/video generation with prompt input (real API)
- `/chat` — Multi-turn conversation refinement (real API)
- `/style` — Style transfer (mock — no backend endpoint)
- `/blend` — Image blending (mock — no backend endpoint)
- `/image-to-video` — Image to video conversion (real API)
- `/gallery` — Masonry gallery with filtering (real API)
- `/templates` — Template library (real API with hardcoded fallback)
- `/settings` — Account, API keys, quota, documentation (real API)
- `/login` — GitHub OAuth login page
- `/auth/callback` — OAuth callback handler
- `/generating-demo` — Generation animation demos (accessible via double-click on logo)
- `/design-system`, `/components`, `/pages-overview` — Internal design reference pages

API Routes (server-side):

- `/api/auth/callback` — Exchanges OAuth code for tokens, sets httpOnly refresh cookie
- `/api/auth/refresh` — Refreshes access token using httpOnly refresh cookie

Query parameters are used for state on the home page (e.g., `/?type=image&prompt=...`).

### Layout

`src/app/layout.tsx` wraps all pages with (outermost → innermost):

- `ThemeProvider` (next-themes + custom animation context)
- `AuthProvider` (GitHub OAuth, token management, user state)
- `SWRProvider` (SWR global config with auth-aware fetcher)
- `QuotaProvider` (real-time quota from `/api/quota`)
- `WebSocketProvider` (auto-connects when authenticated)
- `Navigation` component (sticky top bar with auth-aware user info and quota)
- `Toaster` (sonner)

### Key Directories

```
src/
├── app/                        # Next.js route segments (pages)
│   ├── api/auth/               # Server-side API routes (OAuth token exchange, refresh)
│   ├── auth/callback/          # OAuth callback page
│   └── login/                  # Login page
├── components/
│   ├── ui/                     # 48 Radix UI wrapper components
│   ├── navigation.tsx          # Top nav (auth-aware, real quota display)
│   ├── progressive-image.tsx
│   ├── theme/                  # ThemeProvider + animated transitions
│   └── skeletons/              # Loading skeleton components
├── lib/
│   ├── types.ts                # All API TypeScript types
│   ├── api-client.ts           # ApiClient singleton (all backend calls)
│   ├── swr-config.tsx          # SWR global provider + auth-aware fetcher
│   ├── transforms.ts           # Data transforms (time, mode names, provider mapping, URLs)
│   ├── utils.ts                # cn() utility (clsx + tailwind-merge)
│   ├── auth/
│   │   ├── auth-context.tsx    # AuthProvider (user, token, login/logout)
│   │   └── require-auth.tsx    # Route protection wrapper component
│   ├── quota/
│   │   └── quota-context.tsx   # QuotaProvider (SWR-based, checkBeforeGenerate)
│   └── ws/
│       ├── websocket-client.ts # WebSocket client (auto-reconnect, event dispatch)
│       ├── ws-provider.tsx     # WebSocketProvider (auth-gated connection)
│       └── use-websocket.ts    # useWebSocket / useWebSocketAll hooks
└── styles/
    ├── theme.css               # CSS variables for light/dark themes
    └── index.css               # Tailwind imports
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api   # Backend API base
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/ws        # WebSocket endpoint
NEXT_PUBLIC_GITHUB_CLIENT_ID=<github-client-id>      # GitHub OAuth app
```

### Authentication Flow

1. User clicks login → `GET /api/auth/login` → redirect to GitHub
2. GitHub redirects to `/auth/callback?code=...&state=...`
3. Callback page calls Next.js API Route `POST /api/auth/callback`
4. API Route exchanges code with backend, sets `refresh_token` as httpOnly cookie, returns `access_token`
5. `access_token` stored in React state + `sessionStorage`; `refresh_token` only in httpOnly cookie
6. On page reload, `AuthProvider` tries `sessionStorage` → `getMe()`, falls back to cookie refresh

### API Client

`src/lib/api-client.ts` provides a singleton `ApiClient` class. Get it via `getApiClient()`. It auto-injects `Authorization` headers and supports `X-Provider`/`X-Model` headers for provider routing. All pages use this client for backend calls.

### Legacy Code

`/Aiimagevideogenerator/` contains the old Vite-based version. It is excluded from tsconfig and gitignored. Ignore it for new development.

## Design System

### Colors (Dark Theme — Default)

- Background: `#09090B` / `#18181B` / `#27272A`
- Primary gradient: `linear-gradient(135deg, #7C3AED, #2563EB)`
- Success: `#10B981`, Warning: `#F59E0B`, Error: `#EF4444`
- Text: `#FAFAFA` (primary), `#A1A1AA` (secondary)
- Border: `#3F3F46`

### Spacing & Radius

- 4px grid system (xs: 4px, sm: 8px, md: 12px, base: 16px, lg: 24px)
- Border radius: 8px buttons/inputs, 12px cards, 16px large cards/modals
