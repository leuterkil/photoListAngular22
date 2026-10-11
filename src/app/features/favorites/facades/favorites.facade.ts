import { inject, Injectable } from "@angular/core";
import { FavoritesStore } from "../../../core/stores/favorites.store";

@Injectable()
export class FavoritesFacade{
    public readonly store = inject(FavoritesStore)
}