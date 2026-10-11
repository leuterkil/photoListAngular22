import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfiniteScrollDirective } from './infinite-scroll.directive';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn();

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

@Component({
  imports: [InfiniteScrollDirective],
  template: `<div infiniteScroll [scrollDisabled]="disabled()" [rootMargin]="margin()" (infiniteScroll)="count = count + 1"></div>`,
})
class HostComponent {
  disabled = signal(false);
  margin = signal('300px');
  count = 0;
}

describe('InfiniteScrollDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const active = () => FakeIntersectionObserver.instances.filter((o) => o.disconnect.mock.calls.length === 0);

  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('observes the host element with the configured root margin', () => {
    const [observer] = FakeIntersectionObserver.instances;

    expect(observer.observe).toHaveBeenCalledWith(fixture.nativeElement.querySelector('div'));
    expect(observer.options?.rootMargin).toBe('300px');
  });

  it('emits when the host enters the viewport', () => {
    FakeIntersectionObserver.instances[0].trigger(true);

    expect(host.count).toBe(1);
  });

  it('does not emit when the host is not intersecting', () => {
    FakeIntersectionObserver.instances[0].trigger(false);

    expect(host.count).toBe(0);
  });

  it('stops observing while disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();

    expect(active().length).toBe(0);
  });

  it('observes again when it is re-enabled so a still-visible host loads the next page', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    host.disabled.set(false);
    fixture.detectChanges();

    expect(active().length).toBe(1);
    expect(FakeIntersectionObserver.instances.length).toBe(2);
    active()[0].trigger(true);
    expect(host.count).toBe(1);
  });

  it('recreates the observer when the root margin changes', () => {
    host.margin.set('0px');
    fixture.detectChanges();

    expect(active()[0].options?.rootMargin).toBe('0px');
  });

  it('disconnects when destroyed', () => {
    fixture.destroy();

    expect(active().length).toBe(0);
  });
});
