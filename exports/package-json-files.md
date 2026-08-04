# Passport ATL — package.json files

## package.json
```json
{
  "name": "workspace",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "preinstall": "sh -c 'rm -f package-lock.json yarn.lock; case \"$npm_config_user_agent\" in pnpm/*) ;; *) echo \"Use pnpm instead\" >&2; exit 1 ;; esac'",
    "build": "pnpm run typecheck && pnpm -r --if-present run build",
    "typecheck:libs": "tsc --build",
    "typecheck": "pnpm run typecheck:libs && pnpm -r --filter \"./artifacts/**\" --filter \"./scripts\" --if-present run typecheck"
  },
  "private": true,
  "devDependencies": {
    "typescript": "~5.9.2",
    "prettier": "^3.8.1"
  }
}
```

## artifacts/atlanta-passport/package.json
```json
{
  "name": "@workspace/atlanta-passport",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --config vite.config.ts --host 0.0.0.0",
    "build": "vite build --config vite.config.ts",
    "serve": "vite preview --config vite.config.ts --host 0.0.0.0",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@replit/vite-plugin-cartographer": "catalog:",
    "@replit/vite-plugin-dev-banner": "catalog:",
    "@replit/vite-plugin-runtime-error-modal": "catalog:",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "catalog:",
    "@tanstack/react-query": "catalog:",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/google.maps": "^3.65.0",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vis.gl/react-google-maps": "^1.8.3",
    "@vitejs/plugin-react": "catalog:",
    "@workspace/api-client-react": "workspace:*",
    "class-variance-authority": "catalog:",
    "clsx": "catalog:",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "catalog:",
    "input-otp": "^1.4.2",
    "jsdom": "^29.1.1",
    "lucide-react": "catalog:",
    "next-themes": "^0.4.6",
    "react": "catalog:",
    "react-day-picker": "^9.11.1",
    "react-dom": "catalog:",
    "react-hook-form": "^7.55.0",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.2",
    "sonner": "^2.0.7",
    "tailwind-merge": "catalog:",
    "tailwindcss": "catalog:",
    "tw-animate-css": "^1.4.0",
    "vaul": "^1.1.2",
    "vite": "catalog:",
    "vitest": "^4.1.10",
    "wouter": "^3.3.5",
    "zod": "catalog:"
  },
  "dependencies": {
    "@clerk/react": "^6.7.3",
    "@clerk/themes": "^2.4.57",
    "i18next": "^26.1.0",
    "i18next-browser-languagedetector": "^8.2.1",
    "react-i18next": "^17.0.7"
  }
}
```

## artifacts/api-server/package.json
```json
{
  "name": "@workspace/api-server",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "export NODE_ENV=development && pnpm run build && pnpm run start",
    "build": "node ./build.mjs",
    "start": "node --enable-source-maps ./dist/index.mjs",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@clerk/express": "^2.1.23",
    "@clerk/shared": "^4.15.0",
    "@replit/connectors-sdk": "^0.4.1",
    "@workspace/api-zod": "workspace:*",
    "@workspace/db": "workspace:*",
    "cookie-parser": "^1.4.7",
    "cors": "^2",
    "drizzle-orm": "catalog:",
    "exceljs": "^4.4.0",
    "express": "^5",
    "googleapis": "^171.4.0",
    "http-proxy-middleware": "^4.0.0",
    "pino": "^9",
    "pino-http": "^10",
    "qrcode": "^1.5.4",
    "resend": "^6.12.3"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/node": "catalog:",
    "@types/qrcode": "^1.5.6",
    "@types/supertest": "^7.2.1",
    "esbuild": "^0.27.3",
    "esbuild-plugin-pino": "^2.3.3",
    "pino-pretty": "^13",
    "supertest": "^7.2.2",
    "thread-stream": "3.1.0",
    "vitest": "^4.1.10"
  }
}
```
