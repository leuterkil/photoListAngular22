# Photolist (Stillframe)

An infinite random photo stream with a persistent **Favorites** library, built with Angular 22,
Angular Material, NgRx Signals and SCSS. Photos come from [Picsum](https://picsum.photos).

## Features

- **Photos** (`/`): infinite, scrollable grid that starts at a random page of the Picsum list. New photos load as you scroll (custom
  `IntersectionObserver` directive, no libraries), with skeletons on the first load and a spinner
  afterwards. Every request has an emulated 200–300 ms random delay. Clicking a photo (or its heart)
  toggles it in Favorites.
- **Favorites** (`/favorites`): every favorited photo. Favorites are saved in `localStorage`, so they
  survive a page refresh. Clicking a photo opens it.
- **Photo** (`/photos/:id`): the photo shown large, with a **Remove from favorites** button that returns
  you to the favorites list. Only favorited photos have a page; other ids redirect to `/`.
- The header (Photos / Favorites buttons, active view highlighted) is shared by every page.

## Run locally

Requires Node 20+ and a package manager (the repo has both a `bun.lock` and a `package-lock.json`).

```bash
npm install      # or: bun install
npm start        # serves http://localhost:4200
```

## Scripts

| Command         | What it does                           |
| --------------- | -------------------------------------- |
| `npm start`     | Dev server with live reload            |
| `npm run build` | Production build into `dist/`          |
| `npm test`      | Unit tests (Vitest through `ng test`)  |

## Project structure

```
src/app/
  core/       app-wide, feature-agnostic code: types, constants, services, directives, stores
  features/   one folder per page (photos, favorites, specific-photo), each with components,
              facades, services, stores and types as needed
  shared/     reusable UI components (app-button, photo-card, photo-skeleton)
```

See [`docs/GUIDE.md`](docs/GUIDE.md) for a detailed walkthrough of the architecture and the code.
