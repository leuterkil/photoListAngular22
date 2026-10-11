import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollToTopComponent } from './scroll-to-top.component';

describe('ScrollToTopComponent', () => {
  let fixture: ComponentFixture<ScrollToTopComponent>;
  const button = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button');

  const scrollTo = (y: number) => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
  };

  // jsdom implements neither scrollTo nor matchMedia.
  const stubScrolling = (reduceMotion: boolean) => {
    const scrollToSpy = vi.fn();
    vi.stubGlobal('scrollTo', scrollToSpy);
    vi.stubGlobal('matchMedia', () => ({ matches: reduceMotion }));
    return scrollToSpy;
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(ScrollToTopComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    vi.unstubAllGlobals();
  });

  it('is hidden at the top of the page', () => {
    expect(button()).toBeNull();
  });

  it('appears after scrolling past the threshold', () => {
    scrollTo(401);

    expect(button()).not.toBeNull();
    expect(button()?.getAttribute('aria-label')).toBe('Scroll to top');
  });

  it('stays hidden at or below the threshold', () => {
    scrollTo(400);

    expect(button()).toBeNull();
  });

  it('hides again when scrolling back up', () => {
    scrollTo(900);
    scrollTo(10);

    expect(button()).toBeNull();
  });

  it('honours a custom threshold', () => {
    fixture.componentRef.setInput('threshold', 100);
    scrollTo(150);

    expect(button()).not.toBeNull();
  });

  it('scrolls smoothly to the top when clicked', () => {
    const spy = stubScrolling(false);
    scrollTo(900);

    button()!.click();

    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('jumps instantly when the user prefers reduced motion', () => {
    const spy = stubScrolling(true);
    scrollTo(900);

    button()!.click();

    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
