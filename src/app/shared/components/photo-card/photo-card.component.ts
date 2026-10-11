import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { Photo } from "../../../core/types/photo.types";
import { FavoritesStore } from "../../../core/stores/favorites.store";
import { AppButtonComponent } from "../app-button/app-button.component";

@Component({
    selector:"photo-card",
    templateUrl:"./photo-card.component.html",
    styleUrl:"./photo-card.component.scss",
    imports:[AppButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoCardComponent {
    private readonly _favorites = inject(FavoritesStore);

    public photo = input.required<Photo>();
    public isFavorite = computed(() => this._favorites.ids().includes(this.photo().id));

    public toggleFavorite(): void {
        this._favorites.toggle(this.photo().id);
    }
}
