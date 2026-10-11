import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { PhotosFacade } from '../../facades/photos.facade';
import { PhotosService } from '../../services/photos.service';
import { PhotosStore } from '../../stores/photos.store';
import { PhotosResponse } from '../../types/photos-response.type';
import { PhotosComponent } from './photos.component';

const page = (start: number, count = 9): PhotosResponse[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${start + i}`,
    author: `Author ${start + i}`,
    width: 100,
    height: 100,
    download_url: '',
    url: '',
  }));

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }
  /** Simulates the sentinel scrolling into view on the live (not disconnected) observer. */
  static scrollToEnd(): void {
    const live = FakeIntersectionObserver.instances.filter((o) => o.disconnect.mock.calls.length === 0);
    live.forEach((o) => o.callback([{ isIntersecting: true } as IntersectionObserverEntry], o as unknown as IntersectionObserver));
  }
  static get liveCount(): number {
    return FakeIntersectionObserver.instances.filter((o) => o.disconnect.mock.calls.length === 0).length;
  }
}

describe('PhotosComponent', () => {
  let fixture: ComponentFixture<PhotosComponent>;
  let requests: Subject<PhotosResponse[]>[];
  const index$ = vi.fn();
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    requests = [];
    index$.mockReset();
    index$.mockImplementation(() => {
      const request = new Subject<PhotosResponse[]>();
      requests.push(request);
      return request;
    });
    FakeIntersectionObserver.instances = [];
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    // The component provides its own service/facade/store, so swap the API service there.
    TestBed.overrideComponent(PhotosComponent, {
      set: { providers: [PhotosFacade, PhotosStore, { provide: PhotosService, useValue: { index$ } }] },
    });
    fixture = TestBed.createComponent(PhotosComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Resolves the n-th API request and runs the emulated 200-300ms delay. */
  const respond = (n: number, photos: PhotosResponse[]) => {
    requests[n].next(photos);
    requests[n].complete();
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
  };

  it('requests the first page on init and shows skeletons while fetching', () => {
    expect(index$).toHaveBeenCalledTimes(1);
    expect(index$).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/picsum\.photos\/v2\/list\?page=\d+$/));
    expect(el().querySelectorAll('photo-skeleton').length).toBe(6);
    expect(el().querySelector('mat-spinner')).toBeNull();
  });

  it('renders one card per photo and removes the skeletons once loaded', () => {
    respond(0, page(0));

    expect(el().querySelectorAll('photo-card').length).toBe(9);
    expect(el().querySelectorAll('photo-skeleton').length).toBe(0);
  });

  it('loads the next page when the end of the list scrolls into view and shows the spinner', () => {
    respond(0, page(0));

    FakeIntersectionObserver.scrollToEnd();
    fixture.detectChanges();

    expect(index$).toHaveBeenCalledTimes(2);
    const firstPage = Number(/page=(\d+)/.exec(index$.mock.calls[0][0])![1]);
    expect(index$).toHaveBeenLastCalledWith(`https://picsum.photos/v2/list?page=${firstPage + 1}`);
    expect(el().querySelector('mat-spinner')).not.toBeNull();
    expect(el().textContent).toContain('Loading...');
    expect(el().querySelectorAll('photo-skeleton').length).toBe(0);
  });

  it('does not start another request while one is in flight', () => {
    respond(0, page(0));

    FakeIntersectionObserver.scrollToEnd();
    fixture.detectChanges();
    FakeIntersectionObserver.scrollToEnd();

    expect(index$).toHaveBeenCalledTimes(2);
  });

  it('appends the next page to the list and hides the spinner', () => {
    respond(0, page(0));
    FakeIntersectionObserver.scrollToEnd();
    fixture.detectChanges();

    respond(1, page(9));

    expect(el().querySelectorAll('photo-card').length).toBe(18);
    expect(el().querySelector('mat-spinner')).toBeNull();
  });

  it('stops listening for scroll once the last page has been loaded', () => {
    respond(0, page(0, 3));

    expect(el().querySelectorAll('photo-card').length).toBe(3);
    expect(FakeIntersectionObserver.liveCount).toBe(0);
    FakeIntersectionObserver.scrollToEnd();
    expect(index$).toHaveBeenCalledTimes(1);
  });

  it('offers a scroll-to-top button', () => {
    expect(el().querySelector('scroll-to-top')).not.toBeNull();
  });
});
