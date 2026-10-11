import { TestBed } from '@angular/core/testing';
import { LoadingStateType } from '../../../core/constants/loading-state.constant';
import { Photo } from '../../../core/types/photo.types';
import { PhotosStore } from './photos.store';

const makePhotos = (count: number, start = 0): Photo[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${start + i}`,
    author: 'author',
    width: 100,
    height: 100,
    url: `url-${start + i}`,
    largeUrl: `large-${start + i}`,
  }));

describe('PhotosStore', () => {
  let store: InstanceType<typeof PhotosStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PhotosStore] });
    store = TestBed.inject(PhotosStore);
  });

  it('starts empty', () => {
    expect(store.feed()).toEqual([]);
    expect(store.nextUrl()).toBeNull();
    expect(store.loadingState()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('stores the first full page and points to page 2', () => {
    store.setFeed(makePhotos(9), 1);

    expect(store.feed().length).toBe(9);
    expect(store.nextUrl()).toBe('https://picsum.photos/v2/list?page=2');
  });

  it('appends later pages and advances to the following page', () => {
    store.setFeed(makePhotos(9), 1);
    store.setFeed(makePhotos(9, 9), 2);
    expect(store.feed().length).toBe(18);
    expect(store.nextUrl()).toBe('https://picsum.photos/v2/list?page=3');

    store.setFeed(makePhotos(9, 18), 3);
    expect(store.feed().length).toBe(27);
    expect(store.nextUrl()).toBe('https://picsum.photos/v2/list?page=4');
  });

  it('continues from a random starting page, not from page 1', () => {
    store.setFeed(makePhotos(9), 57);
    expect(store.page()).toBe(57);
    expect(store.nextUrl()).toBe('https://picsum.photos/v2/list?page=58');

    store.setFeed(makePhotos(9, 9), 58);
    expect(store.feed().length).toBe(18);
    expect(store.nextUrl()).toBe('https://picsum.photos/v2/list?page=59');
  });

  it('stops paginating when a page comes back short', () => {
    store.setFeed(makePhotos(9), 1);
    store.setFeed(makePhotos(3, 9), 2);

    expect(store.feed().length).toBe(12);
    expect(store.nextUrl()).toBeNull();
  });

  it('does not paginate after a short first page', () => {
    store.setFeed(makePhotos(4), 1);

    expect(store.nextUrl()).toBeNull();
  });

  it('clears the loading state when photos arrive', () => {
    store.setLoadingState();
    store.setFeed(makePhotos(9), 1);

    expect(store.loadingState()).toBeNull();
  });

  it('reports FETCHING for the first load and LOAD_MORE once a next page exists', () => {
    store.setLoadingState();
    expect(store.loadingState()).toBe(LoadingStateType.FETCHING);

    store.setFeed(makePhotos(9), 1);
    store.setLoadingState();
    expect(store.loadingState()).toBe(LoadingStateType.LOAD_MORE);
  });

  it('records an error and stops loading', () => {
    store.setLoadingState();
    store.setError('boom');

    expect(store.error()).toBe('boom');
    expect(store.loadingState()).toBeNull();
  });
});
