import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

/** Floating button that appears after scrolling down and smoothly returns to the top of the page. */
@Component({
    selector:"scroll-to-top",
    templateUrl:"./scroll-to-top.component.html",
    styleUrl:"./scroll-to-top.component.scss",
    imports:[MatButtonModule,MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host:{ "(window:scroll)": "onScroll()" }
})
export class ScrollToTopComponent {
    /** Scroll distance in px after which the button shows up. */
    public threshold = input(400);
    public visible = signal(false);

    public onScroll(): void {
        this.visible.set(window.scrollY > this.threshold());
    }

    public scrollToTop(): void {
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
}
