# Photolist — Coding Guide

A complete, analytical walkthrough of the codebase: what every piece does, why it is built that way,
how data flows, how to extend it, and how it is tested. Read top-to-bottom once, then use the table of
contents as a reference.

1. [What the app does](#1-what-the-app-does)
2. [Tech stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Project structure](#4-project-structure)
5. [Routing](#5-routing)
6. [Domain model](#6-domain-model)
7. [State management](#7-state-management)
8. [Feature walkthroughs](#8-feature-walkthroughs)
9. [Shared and core building blocks](#9-shared-and-core-building-blocks)
10. [Data flows end to end](#10-data-flows-end-to-end)
11. [Styling and theming](#11-styling-and-theming)
12. [Testing](#12-testing)
13. [Conventions and patterns](#13-conventions-and-patterns)
14. [How to extend the app (recipes)](#14-how-to-extend-the-app-recipes)
15. [Gotchas and lessons learned](#15-gotchas-and-lessons-learned)
16. [Known issues and next steps](#16-known-issues-and-next-steps)
17. [Requirement coverage](#17-requirement-coverage)

---

## 1. What the app does

An infinite random photo stream with a persistent favorites library.

| Page | Path | Behaviour |
| --- | --- | --- |
| Photos | `/` | Infinite grid that starts at a **random page** of the Picsum list. New pages load when you scroll to the bottom. Clicking a photo (or its heart) toggles it in favorites. |
| Favorites | `/favorites` | All favorited photos. Clicking a photo opens its page. Survives a page refresh. |
| Photo | `/photos/:id` | One large (16:9) photo and a **Remove from favorites** button. Removing returns to `/favorites`. Non-favorite ids redirect to `/`. |

The header (Photos / Favorites buttons) lives in the app shell, so it is the same on every page.

## 2. Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Angular 22, standalone components, signals, new control flow (`@if`, `@for`) |
| UI kit | Angular Material 22 (Material 3 theme, `matButton`, `matMiniFab`, `mat-icon`, `mat-spinner`) |
| State | `@ngrx/signals` (`signalStore`) |
| HTTP / async | `HttpClient` + RxJS 7 |
| Styling | SCSS |
| Tests | Vitest through `ng test` (`@angular/build:unit-test`), jsdom |
| Data source | `https://picsum.photos` (list endpoint + image urls) |
| Persistence | `localStorage` only — no backend |

## 3. Architecture

The code is split into three layers with one-way dependencies:

```
features/  ──►  shared/  ──►  core/
(pages)         (reusable UI)   (types, stores, directives, services)
```

* **`core/`** knows nothing about pages. It holds app-wide types, constants, the favorites store, the
  infinite-scroll directive and the HTTP base class.
* **`shared/`** holds presentational components that several pages reuse. They may use `core/`.
* **`features/`** holds one folder per page. A feature may use `shared/` and `core/`, and (sparingly)
  types from another feature.

Inside a feature the responsibilities are layered the same way every time:

```
Component  ──►  Facade  ──►  Service  (HTTP)
                  │
                  └────────►  Store    (state)
```

| Layer | Responsibility | Must not |
| --- | --- | --- |
| **Component** | Template, user events, view-only computed signals. | Call HTTP or write to a store directly. |
| **Facade** | The single entry point a component talks to. Orchestrates service + store, maps API shapes to domain types. | Hold UI concerns. |
| **Service** | One method per HTTP call. Returns raw API types. | Touch state. |
| **Store** | State and the only methods that change it. | Know about HTTP or components. |

Facades, services and the per-page stores are **provided on the component** (`providers: [...]`), so
their state is created when the page opens and dropped when it closes. The favorites store is the
exception: it is `providedIn: 'root'` because many components share it.

## 4. Project structure

```
src/
  index.html                 loads Roboto + Material Symbols (with the FILL axis)
  styles.scss                Material 3 theme + body defaults
  main.ts                    bootstrapApplication(App, appConfig)
  app/
    app.ts / app.html / app.scss   shell: header nav + <router-outlet>
    app.config.ts            router, default icon font set
    app.routes.ts            lazy routes
    core/
      constants/loading-state.constant.ts
      directives/infinite-scroll.directive.ts
      services/abstract-service.directive.ts
      stores/favorites.store.ts
      types/photo.types.ts
    features/
      photos/                components/ facades/ services/ stores/ types/
      favorites/             components/ facades/
      specific-photo/        components/ facades/ guards/
    shared/components/
      app-button/            Material button wrapper
      photo-card/            photo + heart, favorite toggle / navigate
      photo-skeleton/        shimmer placeholder
      scroll-to-top/         floating back-to-top button
    testing/photo.factory.ts test helper (makePhoto)
docs/GUIDE.md                this file
```

Spec files sit next to the code they test (`*.spec.ts`).

## 5. Routing

`src/app/app.routes.ts` — all routes are lazy (`loadComponent`) and set a page title.

| Path | Component | Notes |
| --- | --- | --- |
| `''` | `PhotosComponent` | `Photos \| Stillframe` |
| `favorites` | `FavoritesComponent` | `Favorites \| Stillframe` |
| `photos/:id` | `SpecificPhotoComponent` | `canActivate: [favoritePhotoGuard]` |

**`favoritePhotoGuard`** (`features/specific-photo/guards/favorite-photo.guard.ts`) is a functional
`CanActivateFn`. It reads `:id`, checks `FavoritesStore.ids()`, returns `true`, or a `UrlTree` for `/`.

Why a guard instead of an `@if` redirect inside the component? Removing a photo on that page deletes
it from favorites, and we then want to go to `/favorites`. A reactive "not a favorite → go home" check
inside the component would fight that navigation. The guard only runs when entering the route, so the
two redirects never conflict.

The shell (`app.html`) renders the nav with `routerLink` + `routerLinkActive`; the active button is
`filled`, the inactive one `outlined`.

## 6. Domain model

`core/types/photo.types.ts`:

```ts
type Photo = {
  readonly id: string;
  readonly author: string;
  readonly width: number;
  readonly height: number;
  readonly url: string;      // 600x750 card image
  readonly largeUrl: string; // 1600x900 image for the photo page
};
```

`features/photos/types/photos-response.type.ts` (`PhotosResponse`) is the raw Picsum list item
(`id`, `author`, `width`, `height`, `download_url`, `url`). **API shapes never leave the facade**; the
rest of the app only sees `Photo`.

Both image urls are computed once in `PhotosFacade` when photos are mapped, then stored. Nothing
re-derives them later (this is why favorites carry `largeUrl` in `localStorage`).

`core/constants/loading-state.constant.ts` is a const-object "enum":

```ts
LoadingStateType = { LOAD_MORE: 1, FETCHING: 2 }
```

`FETCHING` = the first load (no photos yet). `LOAD_MORE` = loading additional pages.

## 7. State management

### 7.1 `PhotosStore` (per page)

`features/photos/stores/photos.store.ts`

| State | Meaning |
| --- | --- |
| `feed: Photo[]` | Every photo loaded so far. |
| `page: number \| null` | Last page that was loaded. The stream starts at a random page, so this is not derivable from `feed.length`. |
| `nextUrl: string \| null` | URL of the next page, or `null` when there is no more. |
| `loadingState` | `null`, `FETCHING` or `LOAD_MORE`. |
| `error: string \| null` | Last error message. |

Methods:

* `setFeed(photos, page)` — if a `nextUrl` already exists the photos are **appended**, otherwise they
  **replace** the feed (first load). It records `page` and computes the next one:
  `photos.length >= PAGE_SIZE ? page + 1 : null`. `PAGE_SIZE = 9` and must match the `limit` in
  `PhotosService`.
* `setLoadingState()` — `LOAD_MORE` if `nextUrl` is set, else `FETCHING`.
* `setError(message)` — stores the message **and clears the loading state**, so a failure never leaves
  the UI stuck loading.

### 7.2 `FavoritesStore` (global)

`core/stores/favorites.store.ts` — `signalStore({ providedIn: 'root' })`.

| Member | Description |
| --- | --- |
| `photos` | The favorited `Photo` objects, in the order they were added. |
| `ids` (computed) | `Set<string>` of the favorited ids — O(1) membership checks. |
| `toggle(photo)` | Adds the photo, or removes it if already present. Persists after every change. |

Persistence:

* Key: `photolist.favorites`, value: JSON array of `Photo`.
* `load()` runs when the store is **created** (`withState(() => ({ photos: load() }))`, the factory
  form), not at module import. This makes it testable and always reads fresh data.
* `load()` swallows JSON errors and returns `[]`. `save()` swallows storage errors (quota, private
  mode), so favorites keep working in memory.
* Full `Photo` objects are stored (not just ids) so the favorites page needs **no network requests**.

## 8. Feature walkthroughs

### 8.1 Photos (`features/photos`)

**`PhotosService`** — `index$(url)` does `GET url?limit=9` via `AbstractServiceDirective.get$`.

**`PhotosFacade.index$()`**

1. Picks the page: `store.page() + 1` when a next page exists, otherwise a **random start page**
   `floor(random * 100) + 1` (`MAX_START_PAGE = 100`; the list has about 120 pages of 9, so this leaves
   pages to scroll). The URL is `https://picsum.photos/v2/list?page=<page>`.
2. `store.setLoadingState()` (before the request).
3. Calls the service, then pipes:
   * `delay(200 + Math.random() * 100)` — emulates a real API (**200–300 ms**).
   * `map` — `PhotosResponse[]` → `Photo[]` (builds `url` and `largeUrl`).
   * `tap` — `store.setFeed(photos, page)`.
   * `catchError` — `store.setError(...)`, then rethrow.

**`PhotosComponent`** wires it to the view:

* `_indexSubject` is a "load" trigger; `_index$` is `switchMap` over it into `facade.index$()` (with an
  inner `catchError(() => EMPTY)` so one failed request does not kill the stream), `takeUntil` destroy.
* `ngOnInit` subscribes and fires the first load.
* `loadMore()` ignores calls while `loadingMore()` or when `!hasMore()`; otherwise it fires the subject.
* View signals: `fetching` (first load → skeletons), `loadingMore` (spinner + "Loading..."), `list`, `hasMore`.

Template: grid of `<photo-card>`; six `<photo-skeleton>` while `fetching`; a `<mat-spinner>` row while
`loadingMore`; and a sentinel `<div infiniteScroll …>` at the bottom that calls `loadMore()`.

### 8.2 Favorites (`features/favorites`)

`FavoritesFacade` exposes the global `FavoritesStore`. `FavoritesComponent` renders every
`store.photos()` as a `<photo-card [navigable]="true">`, or an empty-state message. There is no
loading state and no HTTP. Un-favoriting a card (from the card's heart) removes it instantly because the
list is the store signal itself.

### 8.3 Specific photo (`features/specific-photo`)

`SpecificPhotoFacade` reads the `:id` route param (`toSignal` over `paramMap`), exposes
`photo = computed(() => favorites.photos().find(id))`, and `removeFavorite()` which toggles the photo
out of favorites and navigates to `/favorites`. `SpecificPhotoComponent` shows `photo.largeUrl`, the
author, and the remove button. The image is `width: 100%`, `aspect-ratio: 16/9`, `max-height: 75vh`.

## 9. Shared and core building blocks

### `InfiniteScrollDirective` (`core/directives`)

Selector `[infiniteScroll]`. Implemented from scratch with `IntersectionObserver` (no library).

| API | Type | Purpose |
| --- | --- | --- |
| `(infiniteScroll)` | `output<void>` | Emits when the host enters the viewport. |
| `scrollDisabled` | `input<boolean>` (default `false`) | While true, nothing is observed or emitted. |
| `rootMargin` | `input<string>` (default `"300px"`) | Starts loading before the sentinel is really visible. |

Implementation notes:

* An `effect` creates the observer and uses `onCleanup` to disconnect it. The effect depends on
  `scrollDisabled` and `rootMargin`, so changing either rebuilds the observer.
* **Why re-observe on enable?** `IntersectionObserver` only fires on *changes*. If a page loads and the
  sentinel is still on screen (tall viewport, few photos), no new event would come. Creating a fresh
  observer when `scrollDisabled` goes back to `false` produces an initial callback, so loading continues
  until the viewport is filled.
* `ngOnDestroy` also disconnects as a safety net.

### `AbstractServiceDirective` (`core/services`)

Base class for HTTP services. `get$<T>(options?)` returns an RxJS `OperatorFunction<string, T>`: pipe a
URL through it (`of(url).pipe(this.get$({ params }))`) to perform a typed GET returning the body.

### `PhotoCardComponent` (`shared/components/photo-card`)

Inputs: `photo` (required `Photo`), `navigable` (default `false`). OnPush.

| Mode | Photo click | Heart click |
| --- | --- | --- |
| `navigable = false` (Photos page) | toggles favorite | toggles favorite |
| `navigable = true` (Favorites page) | navigates to `/photos/:id` | toggles favorite |

The heart (`app-button` fab) is **outside** the `<a>` so clicking it never navigates. The card exposes
`is-favorite` and `aria-pressed` on the button. A filled heart is done in SCSS:
`font-variation-settings: 'FILL' 1` on the icon, which requires the Material Symbols font loaded **with
the FILL axis** (see §15).

### `AppButtonComponent` (`shared/components/app-button`)

A thin wrapper over Angular Material. No `text` → icon-only `matMiniFab`; with `text` → `matButton`
(`type` input = appearance, default `filled`). Inputs: `text`, `preffixIcon`, `suffixIcon`, `loading`,
`type`. (The `preffix` spelling is the existing public name — keep it consistent.)

### `ScrollToTopComponent` (`shared/components/scroll-to-top`)

A `matMiniFab` pinned bottom-right (`position: fixed`). It listens to `window:scroll` through the
component `host` metadata, and a `visible` signal is true once `window.scrollY` exceeds the `threshold`
input (default 400 px). Clicking calls `window.scrollTo({ top: 0, behavior })`, using `smooth` unless the
user prefers reduced motion. It is placed at the end of the Photos and Favorites templates only (the single
photo page does not need it). It has `aria-label="Scroll to top"`.

### `PhotoSkeletonComponent` (`shared/components/photo-skeleton`)

Shimmer placeholder with the same 600/750 aspect ratio as a card and a placeholder for the heart.
Respects `prefers-reduced-motion`.

## 10. Data flows end to end

**First load of `/`**

```
PhotosComponent.ngOnInit
  └─ _indexSubject.next()
      └─ PhotosFacade.index$()
          ├─ store.setLoadingState()          → FETCHING → skeletons render
          ├─ pick a random start page (1–100)
          ├─ PhotosService.index$(list url)   → GET .../v2/list?page=<random>&limit=9
          ├─ delay 200–300ms
          ├─ map → Photo[]
          └─ store.setFeed()                  → feed filled, page = <random>, nextUrl = ?page=<random+1>, loading null
```

**Scrolling**

```
sentinel enters viewport (300px early)
  └─ (infiniteScroll) → PhotosComponent.loadMore()
      ├─ guard: loadingMore()? hasMore()?
      └─ facade.index$() with nextUrl → LOAD_MORE → spinner → setFeed appends, nextUrl = ?page=N+1
```

When a short page (< 9) arrives, `nextUrl` becomes `null` → `hasMore` false → the directive is disabled.

**Favoriting on `/`**

```
click photo or heart → PhotoCardComponent.toggleFavorite()
  └─ FavoritesStore.toggle(photo) → state updated → localStorage written
      └─ every card's isFavorite computed re-evaluates → heart fills / empties
```

**Opening and removing**

```
/favorites → click photo → /photos/:id
  guard: id in FavoritesStore.ids()? ─ no → redirect "/"
  SpecificPhotoComponent shows photo.largeUrl
  click "Remove from favorites" → toggle + navigate("/favorites")
```

## 11. Styling and theming

* `styles.scss` applies the Material 3 theme with `mat.theme(...)`: cyan primary, orange tertiary, Roboto,
  light color scheme. Use `var(--mat-sys-*)` tokens for colors/typography.
* Component styles are SCSS next to the component (encapsulated). The photo grid is
  `grid-template-columns: repeat(3, minmax(0, 1fr))` with a 24px gap.
* Icons: `index.html` loads **Material Symbols Outlined** via the `css2` URL with
  `opsz,wght,FILL,GRAD@24,400,0..1,0`; `app.config.ts` sets `material-symbols-outlined` as the default
  `mat-icon` font set through `MAT_ICON_DEFAULT_OPTIONS`.

## 12. Testing

Run: `npm test` (watch) or `npx ng test --watch=false` (CI). Runner: Vitest through
`@angular/build:unit-test`, jsdom. `describe/it/expect` are global; import `vi` only if you need it
(it is also global in this setup).

Current suite: **13 files, 75 tests**.

| Spec | What it proves |
| --- | --- |
| `app.spec.ts` | Shell renders, has the two header buttons and a router outlet. |
| `favorites.store.spec.ts` | Toggle add/remove, `ids` set, persistence on every change, restore on load, corrupt JSON fallback, write errors tolerated. |
| `photos.store.spec.ts` | First page → `?page=2`; **continues from a random start page**; later pages append and advance (`3`, `4`…); short page stops pagination; loading states; error clears loading. |
| `photos.facade.spec.ts` | Random start page (1…100) and continuation from it, FETCHING/LOAD_MORE, **200 ms minimum / 300 ms maximum delay** (fake timers + mocked `Math.random`), response → `Photo` mapping incl. `largeUrl`, store update, error handling. |
| `infinite-scroll.directive.spec.ts` | Observes with root margin, emits only when intersecting, stops while disabled, **re-observes on re-enable**, rebuilds on margin change, disconnects on destroy. |
| `favorite-photo.guard.spec.ts` | Allows favorites; redirects to `/` otherwise or when id missing. |
| `photos.component.spec.ts` | First request on init, skeletons, cards, spinner on scroll, **no concurrent requests**, append, stops at the last page. |
| `favorites.component.spec.ts` | Empty state, links to `/photos/:id`, card disappears when un-favorited. |
| `specific-photo.component.spec.ts` | Large image + author, remove button, remove → store updated + `/favorites`, non-favorite renders nothing. |
| `photo-card.component.spec.ts` | Alt text, favorite state, heart toggle, photo-click toggle vs. navigate, heart outside the link. |
| `app-button.component.spec.ts` | Text button vs. mini fab, icons, loading spinner swap. |
| `photo-skeleton.component.spec.ts` | Placeholders render. |
| `scroll-to-top.component.spec.ts` | Hidden at top, shows past the threshold (custom threshold too), hides again, smooth scroll vs. reduced motion. jsdom lacks `scrollTo`/`matchMedia`, so they are stubbed with `vi.stubGlobal`. |

### Techniques used (reuse them)

* **Clean storage:** every spec that touches favorites calls `localStorage.clear()` in `beforeEach`.
* **`makePhoto(id, overrides)`** (`src/app/testing/photo.factory.ts`) builds a valid `Photo`.
* **Fake `IntersectionObserver`:** `vi.stubGlobal('IntersectionObserver', Fake…)`; the fake records
  instances and exposes `trigger()`. jsdom has no `IntersectionObserver`.
* **Fake timers for the delay:** `vi.useFakeTimers()` then `vi.advanceTimersByTime(300)`.
* **Component-scoped providers:** `PhotosComponent` provides its own service/facade/store, so
  `TestBed.overrideProvider` does **not** reach them. Use
  `TestBed.overrideComponent(PhotosComponent, { set: { providers: [PhotosFacade, PhotosStore, { provide: PhotosService, useValue: mock }] } })`.
* **Router in tests:** `provideRouter([...stub routes])` and `RouterTestingHarness` for routed
  components. If a click triggers navigation, register a route for it and `await fixture.whenStable()`,
  otherwise the navigation errors after the injector is destroyed.
* **Guards:** `TestBed.runInInjectionContext(() => guard(route, state))` with a stub snapshot.
* **Signal inputs:** `fixture.componentRef.setInput('name', value)`.

## 13. Conventions and patterns

* **Standalone components only**, lazy-loaded routes, new control flow, `track item.id` in `@for`.
* **Signals first** for state and view-model values; RxJS for HTTP and event streams.
* **Immutability:** domain types are `readonly`; store updates use `patchState` with new arrays.
* **Facade as the seam:** components never inject services or per-page stores directly.
* **One responsibility per file;** SCSS and template live beside the component.
* **Error handling:** store the message, clear the loading state, rethrow from the facade, and let the
  component decide how to survive (`catchError(() => EMPTY)` keeps the stream alive).
* **Accessibility:** meaningful `alt` on images, `aria-pressed` on the favorite toggle, reduced-motion
  support on the skeleton.
* **Style:** match the surrounding code (4-space indent in the existing feature files, double quotes in
  the older files, single quotes in newer specs/config — follow the file you are editing).

## 14. How to extend the app (recipes)

**Add a new page `foo`**

1. Create `features/foo/` with `components/foo/`, and `facades/`, `services/`, `stores/` as needed.
2. Component: standalone, `providers: [FooFacade, FooService, FooStore]`, injects only the facade.
3. Add a lazy route to `app.routes.ts` with a title.
4. Add a header button in `app.html` if it should be in the nav.
5. Write specs next to each file.

**Add a new API call:** add a method to the feature service using `get$`, call it from the facade,
map to a domain type there, write the result via a store method.

**Change the page size:** update `limit` in `PhotosService` **and** `PAGE_SIZE` in `PhotosStore`
(they must match), revisit `MAX_START_PAGE` in `PhotosFacade` (total photos / page size), then adjust
`photos.store.spec.ts` and `photos.facade.spec.ts`.

**Change the image size/ratio:** edit the url construction in `PhotosFacade` (and the SCSS aspect ratio).
Remember previously saved favorites keep their old urls in `localStorage`.

**Add a field to `Photo`:** update the type, the facade mapping, `makePhoto`, and decide how to treat
old favorites already saved without it (see §16).

**Make the card do something else on click:** extend `PhotoCardComponent` with another input/output
instead of branching on route; keep it presentational.

## 15. Gotchas and lessons learned

1. **Pagination bug (fixed).** `setFeed` once computed the next page as `total / 9`, which is `2` again
   after the second page, so page 2 was fetched forever (duplicate photos). The store now remembers the
   last loaded `page` and uses `page + 1` (this also supports the random start), covered by
   `photos.store.spec.ts`.
2. **`IntersectionObserver` only fires on change.** Hence the re-observe-on-enable design in the
   directive. Without it, a sentinel that stays visible stops loading.
3. **Material Symbols need the FILL axis.** The old `fonts.googleapis.com/icon?family=…` URL serves a
   static outline font; `font-variation-settings: 'FILL' 1` does nothing. Use the `css2` URL with
   `FILL@0..1`. Also, `favorite_border` is **not** a Material Symbols name — use `favorite` and change the fill.
4. **`mat-icon` default font set.** Angular Material looks for the legacy `material-icons` class. We set
   `MAT_ICON_DEFAULT_OPTIONS` → `material-symbols-outlined` globally.
5. **Fab colors.** `matMiniFab` sets its own colors; to tint the heart, style the inner `mat-icon`
   (done with `::ng-deep` in `photo-card.component.scss`), not the host.
6. **Component-level providers vs. TestBed overrides** — see §12.
7. **Store initial state timing.** `withState({ photos: load() })` evaluates `load()` once at import.
   Use the factory form `withState(() => ({ … }))` for anything that reads storage.
8. **Type masking.** `index$()` was declared `Observable<Photo[]>` but emitted raw API objects; it only
   compiled because the shapes overlapped. Adding `largeUrl` exposed it. Always `map` API → domain in the facade.
9. **Both `bun.lock` and `package-lock.json`** exist; pick one package manager to avoid drift.

## 16. Known issues and next steps

* **Header highlight:** in `app.html` the Favorites button has both `[type]="…isActive…"` and a static
  `type="filled"`, which can keep it filled permanently. Remove the static attribute.
* **Placeholder title:** `app.html` still renders `<h1>Title</h1>`.
* **Old favorites:** entries saved before `largeUrl` existed have no `largeUrl`; `FavoritesStore.load()`
  does not validate shape, so their photo page image has no `src`. Either validate in `load()` (drop or
  migrate entries) or clear `photolist.favorites`.
* **`AppButtonComponent` loading icon:** it renders `mat-icon` with the literal name `spinner`, which is
  not a Material Symbol (use `progress_activity`) or swap in `mat-spinner`.
* **Errors are not shown** to the user; the photos store keeps `error` but no template reads it. Add an
  error row with a retry that calls `loadMore()`.
* **`PhotosComponent` teardown** is more elaborate than needed (`_destroySubscription`) and declares
  `ngOnDestroy` without `implements OnDestroy`; `takeUntilDestroyed()` would replace it.
* **Random but finite stream.** The first page is random, but Picsum's list is finite (~120 pages). After a
  start at page 100 you can scroll about 20 pages before it ends. For a truly endless stream, wrap past
  the last page back to page 1 or generate ids yourself.
* **Photos can repeat across sessions** (different random start pages overlap with earlier views); within one
  session the pages are consecutive, so there are no duplicates.
* **Not done yet:** push to a public GitHub repository, e2e tests.

## 17. Requirement coverage

| Requirement | Status |
| --- | --- |
| Header with 2 buttons, active view highlighted | Done (see header highlight issue in §16) |
| `/` infinite scrollable list, click adds to favorites | Done |
| New photos on scroll with a loader icon | Done (spinner + "Loading...") |
| Picsum images, emulated API with 200–300 ms random delay | Done (`delay` in the facade, tested) |
| `/favorites` list, click opens photo, persists on refresh | Done (`localStorage`) |
| `/photos/:id` single photo, remove button, shared header | Done (large 16:9, guard for non-favorites) |
| Angular Router, latest Angular, SCSS, Angular Material | Done |
| Infinite scroll implemented without libraries | Done (`InfiniteScrollDirective`) |
| No backend for state | Done |
| Unit tests | Done (75 tests) |
| Scroll-to-top on the photo and favorites lists | Done (`ScrollToTopComponent`) |
| Reusable components / sensible structure | Done (`shared/`, `core/`, `features/`) |
| README with run instructions | Done |
