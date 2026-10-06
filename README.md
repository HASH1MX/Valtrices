# Valtrices

Valtrices is a next-generation Valorant performance tracker built to turn match data into meaningful insights. From detailed match statistics and performance trends to custom performance scores and gameplay analysis, Valtrices helps players understand their strengths, identify weaknesses, and optimize their performance.

> **Status:** foundation only. The desktop shell, navigation, and placeholder Dashboard and Settings pages exist. No match data, statistics, scoring, or analysis is implemented yet, and Supabase is not connected.

## Stack

| Layer   | Choice                                   |
| ------- | ---------------------------------------- |
| Desktop | [Tauri 2](https://tauri.app) (Rust)      |
| UI      | React 19, TypeScript, Vite 8             |
| Styling | Tailwind CSS 4                           |
| Routing | React Router 7 (hash-based, in-app only) |
| Icons   | lucide-react                             |
| Backend | Supabase (PostgreSQL), to be connected   |
| Tooling | pnpm, ESLint (flat config), Prettier     |

## Prerequisites (Windows)

1. **Node.js 22+** and **pnpm 10+**
2. **Rust (stable)** via [rustup](https://rustup.rs)
3. **Microsoft C++ Build Tools** with the _Desktop development with C++_ workload (MSVC compiler, linker, and Windows 11 SDK). Tauri cannot compile without it.
4. **WebView2 runtime** (preinstalled on Windows 11)

Full list: <https://tauri.app/start/prerequisites/>. Run `pnpm tauri info` to check what the machine has.

## Getting started

```bash
pnpm install
copy .env.example .env   # fill in values once Supabase is connected
pnpm tauri dev           # starts Vite on :1420 and opens the desktop window
```

## Scripts

| Command            | What it does                                         |
| ------------------ | ---------------------------------------------------- |
| `pnpm dev`         | Vite dev server only (browser preview, no Tauri IPC) |
| `pnpm tauri dev`   | Desktop app with hot reload                          |
| `pnpm tauri build` | Release build and installers in `src-tauri/target`   |
| `pnpm build`       | Type-check and bundle the frontend into `dist/`      |
| `pnpm typecheck`   | `tsc -b`                                             |
| `pnpm lint`        | ESLint                                               |
| `pnpm format`      | Prettier (write)                                     |
| `pnpm check`       | typecheck + lint + format check                      |

## Project structure

```
.
├── index.html                 # Vite entry
├── public/valtrices.svg       # Logo; source for `pnpm tauri icon`
├── src/                       # React frontend
│   ├── main.tsx               # React root
│   ├── App.tsx                # Routes
│   ├── index.css              # Tailwind import + design tokens
│   ├── layout/                # AppShell, Sidebar
│   ├── pages/                 # DashboardPage, SettingsPage
│   ├── components/            # Small reusable UI pieces
│   └── lib/                   # Non-UI helpers (Tauri bridge, env checks)
└── src-tauri/                 # Rust / Tauri
    ├── tauri.conf.json        # Window, bundle, build config
    ├── capabilities/          # Permission grants per window
    ├── icons/                 # Generated app icons
    └── src/lib.rs             # App setup and IPC commands
```

## Environment variables

Copy `.env.example` to `.env`. Vite compiles `VITE_*` variables into the frontend bundle at build time, so only values that are safe to ship inside a desktop app belong there: the Supabase project URL and the publishable (or legacy anon) key, both of which are designed to be public and are protected by Row Level Security.

**Never** place the Supabase `service_role` / secret key in `.env`, in source, or anywhere in the app. `.env` is git-ignored.
