import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { Photo } from '../types/photo.types';

const STORAGE_KEY = "photolist.favorites";



function load(): Photo[] {
    try {
        const parsed: Photo[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        return parsed;
    } catch {
        return [];
    }
}

function save(photos: Photo[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    } catch {
        // storage unavailable: favorites stay in memory only
    }
}

export const FavoritesStore = signalStore(
    { providedIn: 'root' },
    withState(() => ({ photos: load() })),
    withComputed(store => ({
        ids: computed(() => new Set(store.photos().map(photo => photo.id))),
    })),
    withMethods(store => ({
        toggle(photo: Photo): void {
            const photos = store.ids().has(photo.id)
                ? store.photos().filter(favorite => favorite.id !== photo.id)
                : [...store.photos(), photo];
            patchState(store, { photos });
            save(photos);
        },
    })),
);
