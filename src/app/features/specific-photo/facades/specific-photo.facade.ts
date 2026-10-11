import { computed, inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router, ActivatedRoute } from "@angular/router";
import { map } from "rxjs";
import { FavoritesStore } from "../../../core/stores/favorites.store";

@Injectable()
export class SpecificPhotoFacade{
    private readonly _favorites = inject(FavoritesStore)
    private readonly _router = inject(Router)
    private readonly _id = toSignal(inject(ActivatedRoute).paramMap.pipe(map(params => params.get("id") ?? "")), { requireSync: true })

    public readonly photo = computed(() => this._favorites.photos().find(photo => photo.id === this._id()))

    public removeFavorite(): void {
        const photo = this.photo()
        if (!photo) return
        this._favorites.toggle(photo)
        this._router.navigate(["/favorites"])
    }
}