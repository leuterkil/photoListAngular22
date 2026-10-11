import { LoadingStateType } from "../../../core/constants/loading-state.constant";
import { Photo } from "../../../core/types/photo.types";
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

interface PhotoState {
  feed: Photo[];
  nextUrl: string | null;
  loadingState: LoadingStateType | null;
  error: string | null;
}

const INITIAL_STATE: PhotoState = {
  feed: [],nextUrl: null,
  loadingState: null,error: null,
};

export const PhotosStore = signalStore(
    withState(INITIAL_STATE),
    withMethods(store=>({
        setFeed(photos :Photo[]): void{
            const total = store.feed().length + photos.length;
            const isLoadMore = !!store.nextUrl()

            const nextPage =
            !isLoadMore && photos.length >= 9
                ? 2
                : total % 9 === 0
                ? total / 9
                : null;            
            patchState(store,{
                feed: isLoadMore? [...store.feed(),...photos] : photos,
                loadingState: null,
                nextUrl:nextPage ?`https://picsum.photos/v2/list?page=${nextPage}`: null
            })
        },
        setLoadingState(): void{
            patchState(store,{
                loadingState: store.nextUrl() ? LoadingStateType.LOAD_MORE : LoadingStateType.FETCHING
            })
        },
        setError(errorMessage: string): void{
            patchState(store,{
                error: errorMessage,
                loadingState: null
            })
        }
    })),
);