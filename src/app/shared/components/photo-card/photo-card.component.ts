import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Photo } from "../../../core/types/photo.types";
import { FavoritesStore } from "../../../core/stores/favorites.store";
import { AppButtonComponent } from "../app-button/app-button.component";

@Component({
    selector:"photo-card",
    templateUrl:"./photo-card.component.html",
    styleUrl:"./photo-card.component.scss",
    imports:[AppButtonComponent,RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoCardComponent {
    private readonly _favorites = inject(FavoritesStore);

    public photo = input.required<Photo>();
    /** true: clicking the photo opens its page; false: clicking the photo toggles the favorite. */
    public navigable = input(false);
    public isFavorite = computed(() => this._favorites.ids().has(this.photo().id));

    public toggleFavorite(): void {
        this._favorites.toggle(this.photo());
    }
}
