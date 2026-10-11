import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LoadingStateType } from '../../../core/constants/loading-state.constant';
import { PhotosService } from '../services/photos.service';
import { PhotosStore } from '../stores/photos.store';
import { PhotosResponse } from '../types/photos-response.type';
import { PhotosFacade } from './photos.facade';

const responses = (count: number, start = 0): PhotosResponse[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${start + i}`,
    author: `Author ${start + i}`,
    width: 5000,
    height: 3000,
    download_url: 'download',
    url: 'page',
  }));

describe('PhotosFacade', () => {
  let facade: PhotosFacade;
  let store: InstanceType<typeof PhotosStore>;
  const service = { index$: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    // Math.random drives both the start page and the delay; 0 => page 1 and 200ms.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    service.index$.mockReset();
    service.index$.mockReturnValue(of(responses(9)));
    TestBed.configureTestingModule({
      providers: [PhotosFacade, PhotosStore, { provide: PhotosService, useValue: service }],
    });
    facade = TestBed.inject(PhotosFacade);
    store = facade.store;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts the stream at a random page (1 for the lowest roll)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    facade.index$().subscribe();

    expect(service.index$).toHaveBeenCalledWith('https://picsum.photos/v2/list?page=1');
  });

  it('starts at page 100 at most, so there are pages left to scroll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    facade.index$().subscribe();

    expect(service.index$).toHaveBeenCalledWith('https://picsum.photos/v2/list?page=100');
  });

  it('picks different start pages on different loads', () => {
    const random = vi.spyOn(Math, 'random');
    random.mockReturnValue(0.1);
    facade.index$().subscribe();
    random.mockReturnValue(0.6);
    TestBed.inject(PhotosStore).setError('reset');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [PhotosFacade, PhotosStore, { provide: PhotosService, useValue: service }],
    });
    TestBed.inject(PhotosFacade).index$().subscribe();

    const urls = service.index$.mock.calls.map(([url]) => url);
    expect(urls).toEqual(['https://picsum.photos/v2/list?page=11', 'https://picsum.photos/v2/list?page=61']);
  });

  it('marks the first load as FETCHING', () => {
    facade.index$().subscribe();

    expect(store.loadingState()).toBe(LoadingStateType.FETCHING);
  });

  it('waits for the emulated delay before emitting (200ms minimum)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const next = vi.fn();
    facade.index$().subscribe(next);

    vi.advanceTimersByTime(199);
    expect(next).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('never delays longer than 300ms', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const next = vi.fn();
    facade.index$().subscribe(next);

    vi.advanceTimersByTime(300);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('maps the API response to photos with card and large urls', () => {
    let emitted: unknown;
    facade.index$().subscribe((photos) => (emitted = photos));
    vi.advanceTimersByTime(300);

    expect((emitted as unknown[])[0]).toEqual({
      id: '0',
      author: 'Author 0',
      width: 5000,
      height: 3000,
      url: 'https://picsum.photos/id/0/600/750',
      largeUrl: 'https://picsum.photos/id/0/1600/900',
    });
  });

  it('puts the photos in the store and clears loading', () => {
    facade.index$().subscribe();
    vi.advanceTimersByTime(300);

    expect(store.feed().length).toBe(9);
    expect(store.loadingState()).toBeNull();
    expect(store.nextUrl()).toBe('https://picsum.photos/v2/list?page=2');
    expect(store.page()).toBe(1);
  });

  it('continues from a random start page when loading more', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    facade.index$().subscribe();
    vi.advanceTimersByTime(300);
    expect(service.index$).toHaveBeenLastCalledWith('https://picsum.photos/v2/list?page=51');

    service.index$.mockReturnValue(of(responses(9, 9)));
    facade.index$().subscribe();
    expect(service.index$).toHaveBeenLastCalledWith('https://picsum.photos/v2/list?page=52');
  });

  it('loads the next page as LOAD_MORE and appends to the feed', () => {
    facade.index$().subscribe();
    vi.advanceTimersByTime(300);
    service.index$.mockReturnValue(of(responses(9, 9)));

    facade.index$().subscribe();
    expect(service.index$).toHaveBeenLastCalledWith('https://picsum.photos/v2/list?page=2');
    expect(store.loadingState()).toBe(LoadingStateType.LOAD_MORE);

    vi.advanceTimersByTime(300);
    expect(store.feed().length).toBe(18);
  });

  it('stores the error, stops loading and rethrows when the request fails', () => {
    service.index$.mockReturnValue(throwError(() => new Error('offline')));
    const error = vi.fn();

    facade.index$().subscribe({ error });

    expect(error).toHaveBeenCalled();
    expect(store.error()).toBe('offline');
    expect(store.loadingState()).toBeNull();
  });
});
