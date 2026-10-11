import { ScrollToTopComponent } from "../../../../shared/components/scroll-to-top/scroll-to-top.component";
import { Component, inject } from "@angular/core";
import { PhotoCardComponent } from "../../../../shared/components/photo-card/photo-card.component";
import { FavoritesFacade } from "../../facades/favorites.facade";

@Component({
    selector:"favorites",
    templateUrl:"./favorites.component.html",
    styleUrls:["./favorites.component.scss"],
    imports:[ScrollToTopComponent,PhotoCardComponent],
    providers:[FavoritesFacade]
})
export class FavoritesComponent{

    private readonly _facade = inject(FavoritesFacade)

    public readonly list = this._facade.store.photos
}
