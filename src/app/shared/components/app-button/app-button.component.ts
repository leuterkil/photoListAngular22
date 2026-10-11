import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import {MatButtonAppearance, MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
    selector:"app-button",
    templateUrl:"./app-button.component.html",
    styleUrl:"./app-button.component.scss",
    imports:[MatButtonModule,MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppButtonComponent {
    public text = input<string>();
    public preffixIcon = input<string>();
    public suffixIcon = input();
    public loading = input();
    public type = input<"" | MatButtonAppearance>("filled");

}