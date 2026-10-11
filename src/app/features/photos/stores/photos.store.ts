import { LoadingStateType } from "../../../core/constants/loading-state.constant";
import { Photo } from "../../../core/types/photo.types";
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

interface PhotoState {
  feed: Photo[];
  /** Last page that was loaded; the stream can start at any page. */
  page: number | null;
  nextUrl: string | null;
  loadingState: LoadingStateType | null;
  error: string | null;
}

// Must match the `limit` the photos service asks the API for.
const PAGE_SIZE = 9;

const INITIAL_STATE: PhotoState = {
  feed: [],page: null,nextUrl: null,
  loadingState: null,error: null,
};

export const PhotosStore = signalStore(
    withState(INITIAL_STATE),
    withMethods(store=>({
        setFeed(photos :Photo[], page: number): void{
            // Appending or replacing: later pages are appended, the first load replaces the feed.
            const isLoadMore = !!store.nextUrl()
            // A next page exists while the API keeps returning full pages.
            const nextPage = photos.length >= PAGE_SIZE ? page + 1 : null
            patchState(store,{
                feed: isLoadMore ? [...store.feed(), ...photos] : photos,
                page,
                loadingState: null,
                nextUrl: nextPage ? `https://picsum.photos/v2/list?page=${nextPage}` : null
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