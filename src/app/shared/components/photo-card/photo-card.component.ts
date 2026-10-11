import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { Photo } from "../../../core/types/photo.types";
import { AppButtonComponent } from "../app-button/app-button.component";

@Component({
    selector:"photo-card",
    templateUrl:"./photo-card.component.html",
    styleUrl:"./photo-card.component.scss",
    imports:[AppButtonComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoCardComponent {
    public photo = input.required<Photo>();
}
