import { inject, Injectable } from "@angular/core";
import { PhotosService } from "../services/photos.service";
import { PhotosStore } from "../stores/photos.store";
import { catchError, delay, map, Observable, tap, throwError } from "rxjs";
import { Photo } from "../../../core/types/photo.types";
import { PhotosResponse } from "../types/photos-response.type";

const LIST_URL = "https://picsum.photos/v2/list"

const MAX_START_PAGE = 100

@Injectable()
export class PhotosFacade{
    private readonly _service = inject(PhotosService)
    public readonly store = inject(PhotosStore)

    public index$():Observable<Photo[]>{
        // First load starts at a random page; scrolling continues from there.
        const page: number = this.store.nextUrl() ? (this.store.page() ?? 0) + 1 : Math.floor(Math.random() * MAX_START_PAGE) + 1
        const url: string = `${LIST_URL}?page=${page}`
        this.store.setLoadingState()
        return this._service.index$(url).pipe(delay(200 + Math.random() * 100),map((response: PhotosResponse[]): Photo[] => response.map(picSumPhoto=>{
            const id = encodeURIComponent(picSumPhoto.id)
            return {
                id: picSumPhoto.id,
                height: picSumPhoto.height,
                width: picSumPhoto.width,
                url: `https://picsum.photos/id/${id}/${600}/${750}`,
                largeUrl: `https://picsum.photos/id/${id}/${1600}/${900}`,
                author: picSumPhoto.author
            }
        })),tap((photos: Photo[]): void =>{
            this.store.setFeed(photos, page)
        }),catchError((error: unknown)=>{
            this.store.setError(error instanceof Error ? error.message : "Failed to load photos")
            return throwError(()=>error)
        }))
    }
}