import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { map } from "rxjs";
import { FavoritesStore } from "../../../../core/stores/favorites.store";
import { AppButtonComponent } from "../../../../shared/components/app-button/app-button.component";
import { SpecificPhotoFacade } from "../../facades/specific-photo.facade";

@Component({
    selector:"specific-photo",
    templateUrl:"./specific-photo.component.html",
    styleUrls:["./specific-photo.component.scss"],
    imports:[AppButtonComponent],
    providers:[SpecificPhotoFacade]
})
export class SpecificPhotoComponent{

    private readonly _facade = inject(SpecificPhotoFacade)

    public readonly photo = this._facade.photo;

    // The stored url is the 600x750 card crop; request a larger 16:9 render for this page.
    public largeUrl(id: string): string {
        return `https://picsum.photos/id/${encodeURIComponent(id)}/1600/900`
    }

    public removeFavorite(): void {
        this._facade.removeFavorite();
    }
}
