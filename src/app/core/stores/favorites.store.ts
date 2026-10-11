import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

const STORAGE_KEY = "photolist.favorites";

function load(): string[] {
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
        return [];
    }
}

function save(ids: string[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
        // storage unavailable: favorites stay in memory only
    }
}

export const FavoritesStore = signalStore(
    { providedIn: 'root' },
    withState({ ids: load() }),
    withMethods(store => ({
        toggle(id: string): void {
            const ids = store.ids().includes(id)
                ? store.ids().filter(favoriteId => favoriteId !== id)
                : [...store.ids(), id];
            patchState(store, { ids });
            save(ids);
        },
    })),
);
