import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { FavoritesStore } from '../../../../core/stores/favorites.store';
import { makePhoto } from '../../../../testing/photo.factory';
import { SpecificPhotoComponent } from './specific-photo.component';

@Component({ template: '' })
class FavoritesStubComponent {}

describe('SpecificPhotoComponent', () => {
  let favorites: InstanceType<typeof FavoritesStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'photos/:id', component: SpecificPhotoComponent },
          { path: 'favorites', component: FavoritesStubComponent },
        ]),
      ],
    });
    favorites = TestBed.inject(FavoritesStore);
    favorites.toggle(makePhoto('4'));
  });

  const open = async (id: string) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/photos/${id}`, SpecificPhotoComponent);
    return harness;
  };
  const root = (harness: RouterTestingHarness) => harness.routeNativeElement as HTMLElement;

  it('shows the large photo and its author', async () => {
    const el = root(await open('4'));

    expect(el.querySelector('img')?.getAttribute('src')).toBe('https://picsum.photos/id/4/1600/900');
    expect(el.querySelector('.author')?.textContent).toContain('Author 4');
  });

  it('has a "Remove from favorites" button', async () => {
    const el = root(await open('4'));

    expect(el.querySelector('app-button')?.textContent).toContain('Remove from favorites');
  });

  it('removes the photo and goes back to the favorites list', async () => {
    const harness = await open('4');

    root(harness).querySelector<HTMLElement>('app-button')!.click();
    await harness.fixture.whenStable();

    expect(favorites.ids().has('4')).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/favorites');
  });

  it('renders nothing for a photo that is not a favorite', async () => {
    const el = root(await open('404'));

    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('app-button')).toBeNull();
  });
});
