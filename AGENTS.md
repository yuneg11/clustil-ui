# Instructions for Agent

This file provides guidance to agents when working with code in this repository.

## Project Overview

Clustil UI is a real-time GPU cluster monitoring dashboard built with React 19, TypeScript, Tailwind CSS 4, and shadcn/ui with Base UI styling.
It displays node and GPU metrics (temperature, utilization, memory) via Server-Sent Events (SSE) streaming from the Clustil Backend.

## Development Commands

```bash
bun install         # Install dependencies
bun run prepare     # Install Husky git hooks (run after clone)
bun run dev         # Start dev server (connects to backend at :3001)
bun run dev:demo    # Standalone demo mode with mock data (no backend needed)
bun run dev:server  # Start mock SSE backend server
bun run build       # Production build (runs TypeScript check first)
bun run check       # Run Biome linter + formatter checks
bun run check:fix    # Auto-fix linting and formatting issues
```

## Architecture

### Data Flow

1. Frontend connects to SSE endpoint (`GET /stream`)
2. Server sends full updates on connect, then delta updates periodically
3. `useSSE` hook parses messages and applies deltas to local state
4. Components render from state lifted to `Dashboard`
5. GPU memos are saved via `POST /api/memo`

### Type System

Uses discriminated unions for type-safe node/GPU state handling:

- `Node = NodeOnline | NodeOffline` (discriminated by `active: true/false`)
- `GPU = GPUOnline | GPUOffline` (same pattern)
- `NodeDelta` and `GPUDelta` types for optimized SSE streaming

All types are defined in `src/types.ts`.

### Key Files

- `src/hooks/useSSE.ts` - SSE connection and delta application logic
- `src/hooks/useDemo.ts` - Demo mode data generation
- `src/components/dashboard.tsx` - Main layout, holds node state
- `src/lib/demo.ts` - Mock data generation (shared between hooks and server)

### UI Components

Uses shadcn/ui with Base UI styling. Components in `src/components/ui/` are auto-generated and should not be edited directly.
Add new components with:

```bash
bunx shadcn@latest add <component-name>
```

## Code Quality

- **Linter/Formatter**: Biome (not ESLint/Prettier)
- **Pre-commit hooks**: Husky + lint-staged run checks automatically
- **TypeScript**: Strict mode enabled globally
- Biome excludes `src/components/ui/*.tsx` from linting

## Environment Variables

Variables must be prefixed with `CLUSTIL_`:

| Variable       | Description         | Default                 |
| -------------- | ------------------- | ----------------------- |
| `CLUSTIL_NAME` | Dashboard title     | `Clustil`               |
| `CLUSTIL_HOST` | Backend server URL  | `http://localhost:3001` |
