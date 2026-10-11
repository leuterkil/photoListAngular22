import { Component, computed, inject, OnInit, Signal } from "@angular/core";
import { catchError, EMPTY, Observable, Subject, Subscription, switchMap, takeUntil } from "rxjs";
import { PhotosFacade } from "../../facades/photos.facade";
import { Photo } from "../../../../core/types/photo.types";
import { LoadingStateType } from "../../../../core/constants/loading-state.constant";
import { PhotosService } from "../../services/photos.service";
import { PhotosStore } from "../../stores/photos.store";
import { PhotoCardComponent } from "../../../../shared/components/photo-card/photo-card.component";
import { InfiniteScrollDirective } from "../../../../core/directives/infinite-scroll.directive";
import { PhotoSkeletonComponent } from "../../../../shared/components/photo-skeleton/photo-skeleton.component";
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@Component({
    selector:"photos",
    templateUrl:"./photos.component.html",
    styleUrls:["./photos.component.scss"],
    imports:[PhotoCardComponent,PhotoSkeletonComponent,InfiniteScrollDirective,MatProgressSpinnerModule],
    providers:[PhotosService,PhotosFacade,PhotosStore]
})
export class PhotosComponent implements OnInit{

    private readonly _facade = inject(PhotosFacade)


    private readonly _destroySubject: Subject<void> = new Subject();
    private readonly _destroy$: Observable<void> = this._destroySubject.asObservable();

    private _destroySubscription!: Subscription;

    private readonly _indexSubject: Subject<void> = new Subject
    private readonly _index$: Observable<Photo[]> = this._indexSubject.asObservable().pipe(
        switchMap(()=>this._facade.index$().pipe(catchError(()=>EMPTY))),
        takeUntil(this._destroy$)
    )

    public readonly fetching = computed(() => this._facade.store.loadingState() === LoadingStateType.FETCHING);
    public readonly loadingMore = computed(() => this._facade.store.loadingState() === LoadingStateType.LOAD_MORE);
    public readonly skeletons = Array(6);
    public list!: Signal<Photo[]>;
    public hasMore!: Signal<boolean>;

    public ngOnInit(): void {
        this.list = this._facade.store.feed;
        this.hasMore = computed(() => !!this._facade.store.nextUrl());
        this._index$.subscribe();
        this._indexSubject.next();
        this._destroySubscription = this._destroy$.subscribe()
    }

    public loadMore(): void{
        if (this.loadingMore() || !this.hasMore()) return;
        this._indexSubject.next();
    }

    public ngOnDestroy(): void{
        this._destroySubject.next();
        this._destroySubscription.unsubscribe();
    }
}
