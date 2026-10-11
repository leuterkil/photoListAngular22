import { inject, Injectable } from "@angular/core";
import { PhotosService } from "../services/photos.service";
import { PhotosStore } from "../stores/photos.store";
import { catchError, delay, Observable, tap, throwError } from "rxjs";
import { Photo } from "../../../core/types/photo.types";
import { PhotosResponse } from "../types/photos-response.type";

@Injectable()
export class PhotosFacade{
    private readonly _service = inject(PhotosService)
    public readonly store = inject(PhotosStore)

    public index$():Observable<Photo[]>{
        const url: string = this.store.nextUrl() ?? "https://picsum.photos/v2/list"
        this.store.setLoadingState()
        return this._service.index$(url).pipe(delay(200 + Math.random() * 100),tap((response: PhotosResponse[]): void =>{
            const photos: Photo[] = response.map(picSumPhoto=>({id: picSumPhoto.id,height: picSumPhoto.height,width:picSumPhoto.width, url:`https://picsum.photos/id/${encodeURIComponent(picSumPhoto.id)}/${600}/${750}`,author: picSumPhoto.author}))
            this.store.setFeed(photos)
        }),catchError((error: unknown)=>{
            this.store.setError(error instanceof Error ? error.message : "Failed to load photos")
            return throwError(()=>error)
        }))
    }
}