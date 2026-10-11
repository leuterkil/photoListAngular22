import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppButtonComponent } from './shared/components/app-button/app-button.component';

@Component({
  imports: [RouterOutlet,AppButtonComponent,RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('photolist');
}
