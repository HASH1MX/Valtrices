# Valtrices

Valtrices is a next-generation Valorant performance tracker built to turn match data into meaningful insights. From detailed match statistics and performance trends to custom performance scores and gameplay analysis, Valtrices helps players understand their strengths, identify weaknesses, and optimize their performance.

> **Status:** foundation only. The desktop shell builds into a Windows installer; navigation and placeholder Dashboard and Settings pages exist. No match data, statistics, scoring, or analysis is implemented yet. Supabase is connected (client + health check only), with no tables yet.

## Stack

| Layer   | Choice                                   |
| ------- | ---------------------------------------- |
| Desktop | [Tauri 2](https://tauri.app) (Rust)      |
| UI      | React 19, TypeScript, Vite 8             |
| Styling | Tailwind CSS 4                           |
| Routing | React Router 7 (hash-based, in-app only) |
| Icons   | lucide-react                             |
| Backend | Supabase (PostgreSQL) via supabase-js    |
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
copy .env.example .env   # then fill in your Supabase project URL and publishable key
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

## Install on Windows

Download `Valtrices_<version>_x64-setup.exe` from the GitHub Releases page, run it, and launch
Valtrices from the Start menu. The installer is per-user (no administrator rights) and installs
the WebView2 runtime if the machine lacks it.

The installer is not code-signed yet, so Windows SmartScreen shows "Windows protected your PC"
on first run. Choose "More info" then "Run anyway".

## Building the installer locally

```bash
pnpm tauri build
```

Outputs:

- `src-tauri/target/release/valtrices.exe`: standalone executable
- `src-tauri/target/release/bundle/nsis/Valtrices_<version>_x64-setup.exe`: installer

## Releasing

Releases are built by [.github/workflows/release.yml](.github/workflows/release.yml).

1. Bump `version` in `package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml` (keep them equal).
2. Commit, then tag and push the tag:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. GitHub Actions builds the installer and publishes a release for the tag with the installer
   attached. It appears on the Releases page as soon as the build finishes, usually within ten
   minutes. A tag containing a hyphen, such as `v0.2.0-rc.1`, is published as a pre-release and
   is not shown as "Latest".

Running the workflow by hand ("Run workflow" button) builds the installer and attaches it to
the workflow run as an artifact without creating a release.

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
│   ├── hooks/                 # React hooks (e.g. Supabase health)
│   └── lib/                   # Non-UI helpers (Tauri bridge, Supabase client)
├── supabase/
│   └── migrations/            # Versioned SQL migrations (none yet)
└── src-tauri/                 # Rust / Tauri
    ├── tauri.conf.json        # Window, bundle, build config
    ├── capabilities/          # Permission grants per window
    ├── icons/                 # Generated app icons
    └── src/lib.rs             # App setup and IPC commands
```

## Environment variables

Copy `.env.example` to `.env`. Vite compiles `VITE_*` variables into the frontend bundle at build time, so only values that are safe to ship inside a desktop app belong there: the Supabase project URL and the publishable (or legacy anon) key, both of which are designed to be public and are protected by Row Level Security.

**Never** place the Supabase `service_role` / secret key in `.env`, in source, or anywhere in the app. `.env` is git-ignored.

## Supabase

- [src/lib/supabase.ts](src/lib/supabase.ts) is the only place the client is created. It reads the two `VITE_` variables and exports `null` when they are missing, so the UI shows "Not configured" instead of crashing.
- The Settings page runs a reachability check against the project's auth service (`/auth/v1/health`) using the publishable key. It touches no tables.
- All database access from the app goes through supabase-js with the publishable key and Row Level Security. Nothing with elevated rights runs in the client.
- Schema changes go in [supabase/migrations](supabase/migrations) as SQL files. See [supabase/README.md](supabase/README.md). None exist yet.
- The Content Security Policy in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) pins `connect-src` to this project's host. If `.env` is pointed at a different project, update the CSP as well.
