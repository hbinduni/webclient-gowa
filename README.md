# WhatsApp Web API Client

React frontend for [go-whatsapp-web-multidevice](https://github.com/aldinokemal/go-whatsapp-web-multidevice).

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Styling
- **Biome** - Linting and formatting
- **Bun** - Package manager and runtime

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- Go WhatsApp API server running on `http://localhost:8080`

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
# Build for production
bun run build

# Preview production build
bun preview
```

## Configuration

In development, Vite proxy forwards API requests to the Go backend:

- `/api/*` → `http://localhost:8080`
- `/auth/*` → `http://localhost:8080`
- `/admin/*` → `http://localhost:8080`
- `/ws` → `ws://localhost:8080`

For production, set the `VITE_API_URL` environment variable to your Go backend URL.

## Scripts

```bash
bun dev          # Start dev server
bun build        # Build for production
bun preview      # Preview production build
bun check        # Run Biome linter
bun check:fix    # Fix linting issues
bun format       # Format code
```

## Features

- JWT authentication with automatic token refresh
- Multi-client WhatsApp management
- QR code login for WhatsApp devices
- Real-time status updates via WebSocket
- Quick message sending
- Responsive design with WhatsApp-themed UI
