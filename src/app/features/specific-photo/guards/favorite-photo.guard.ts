import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { FavoritesStore } from "../../../core/stores/favorites.store";

/** Only favorited photos have a page; anything else goes back to the photo list. */
export const favoritePhotoGuard: CanActivateFn = (route) => {
    const id = route.paramMap.get("id") ?? "";
    return inject(FavoritesStore).ids().has(id) || inject(Router).createUrlTree(["/"]);
};
