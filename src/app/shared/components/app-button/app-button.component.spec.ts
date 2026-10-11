import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppButtonComponent } from './app-button.component';

describe('AppButtonComponent', () => {
  let fixture: ComponentFixture<AppButtonComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const icons = () => Array.from(el().querySelectorAll('mat-icon')).map((i) => i.textContent?.trim());

  beforeEach(() => {
    fixture = TestBed.createComponent(AppButtonComponent);
  });

  it('renders a text button when text is provided', () => {
    fixture.componentRef.setInput('text', 'Photos');
    fixture.detectChanges();

    expect(el().querySelector('button')?.textContent).toContain('Photos');
  });

  it('renders an icon-only mini fab when there is no text', () => {
    fixture.componentRef.setInput('preffixIcon', 'favorite');
    fixture.detectChanges();

    expect(el().querySelector('button.mat-mdc-mini-fab')).not.toBeNull();
    expect(icons()).toEqual(['favorite']);
  });

  it('renders prefix and suffix icons around the text', () => {
    fixture.componentRef.setInput('text', 'Next');
    fixture.componentRef.setInput('preffixIcon', 'a');
    fixture.componentRef.setInput('suffixIcon', 'b');
    fixture.detectChanges();

    expect(icons()).toEqual(['a', 'b']);
  });

  it('swaps the suffix icon for the spinner while loading', () => {
    fixture.componentRef.setInput('text', 'Next');
    fixture.componentRef.setInput('suffixIcon', 'b');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(icons()).toEqual(['spinner']);
  });
});
