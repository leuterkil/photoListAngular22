import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
    selector:"photo-skeleton",
    templateUrl:"./photo-skeleton.component.html",
    styleUrl:"./photo-skeleton.component.scss",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoSkeletonComponent {}
