import { Directive, effect, ElementRef, inject, input, OnDestroy, output } from "@angular/core";

/**
 * Emits `infiniteScroll` whenever the host (a sentinel placed after the list) enters the viewport.
 * While `scrollDisabled` is true nothing is emitted; when it flips back to false the host is
 * re-observed, so a sentinel that is still visible triggers the next load.
 */
@Directive({
    selector:"[infiniteScroll]",
})
export class InfiniteScrollDirective implements OnDestroy {
    public readonly scrollDisabled = input<boolean>(false);
    public readonly rootMargin = input<string>("300px");
    public readonly infiniteScroll = output<void>();

    private readonly _host: ElementRef<HTMLElement> = inject(ElementRef);
    private _observer?: IntersectionObserver;

    constructor() {
        effect((onCleanup) => {
            if (this.scrollDisabled()) return;
            this._observer = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) this.infiniteScroll.emit(); },
                { rootMargin: this.rootMargin() }
            );
            this._observer.observe(this._host.nativeElement);
            onCleanup(() => this._observer?.disconnect());
        });
    }

    public ngOnDestroy(): void {
        this._observer?.disconnect();
    }
}
