import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { FavoritesStore } from '../../../core/stores/favorites.store';
import { makePhoto } from '../../../testing/photo.factory';
import { PhotoCardComponent } from './photo-card.component';

@Component({ template: '' })
class PhotoPageStubComponent {}

describe('PhotoCardComponent', () => {
  let fixture: ComponentFixture<PhotoCardComponent>;
  let favorites: InstanceType<typeof FavoritesStore>;
  const el = () => fixture.nativeElement as HTMLElement;
  const fab = () => el().querySelector<HTMLElement>('app-button')!;
  const image = () => el().querySelector<HTMLImageElement>('img')!;

  const create = (navigable = false) => {
    fixture = TestBed.createComponent(PhotoCardComponent);
    fixture.componentRef.setInput('photo', makePhoto('3'));
    fixture.componentRef.setInput('navigable', navigable);
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'photos/:id', component: PhotoPageStubComponent }])] });
    favorites = TestBed.inject(FavoritesStore);
  });

  it('shows the photo with an accessible alt text', () => {
    create();

    expect(image().getAttribute('src')).toBe('https://picsum.photos/id/3/600/750');
    expect(image().alt).toBe('Photograph by Author 3');
  });

  it('is not marked as favorite by default', () => {
    create();

    expect(fab().classList.contains('is-favorite')).toBe(false);
    expect(fab().getAttribute('aria-pressed')).toBe('false');
  });

  it('reflects an existing favorite', () => {
    favorites.toggle(makePhoto('3'));
    create();

    expect(fab().classList.contains('is-favorite')).toBe(true);
    expect(fab().getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles the favorite from the heart button', () => {
    create();

    fab().click();
    fixture.detectChanges();
    expect(favorites.ids().has('3')).toBe(true);
    expect(fab().classList.contains('is-favorite')).toBe(true);

    fab().click();
    fixture.detectChanges();
    expect(favorites.ids().has('3')).toBe(false);
  });

  it('toggles the favorite when the photo itself is clicked (non-navigable)', () => {
    create(false);

    image().click();

    expect(favorites.ids().has('3')).toBe(true);
    expect(el().querySelector('a')).toBeNull();
  });

  it('links to the photo page instead when navigable', async () => {
    create(true);

    expect(el().querySelector('a')?.getAttribute('href')).toBe('/photos/3');
    image().click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/photos/3');
    expect(favorites.ids().has('3')).toBe(false);
  });

  it('keeps the heart outside the link so toggling it does not navigate', () => {
    create(true);

    expect(el().querySelector('a')?.contains(fab())).toBe(false);
  });
});
