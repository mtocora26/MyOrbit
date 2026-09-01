# myorbit-mobile-app

React + Vite + Tailwind CSS project for MyOrbit.

## Development Server

Use Vite for local development.

- Start: `pnpm dev`
- Default URL: `http://localhost:8443/`
- Hot reload: changes are reflected immediately

## Project Structure

- `src/main.tsx` - React entrypoint that mounts `src/App.tsx`
- `src/App.tsx` - Main app container and tab/subscreen navigation state
- `src/index.css` - Global CSS and Tailwind CSS v4 import
- `index.html` - Vite HTML shell with `#root`
- `package.json` - Scripts and dependencies
- `vite.config.ts` - Vite config with React, Tailwind, and `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 + React DOM 19
- Styling: Tailwind CSS v4 with `@tailwindcss/vite`
- Tooling: Vite 8 + TypeScript 5
- Formatting: oxfmt
