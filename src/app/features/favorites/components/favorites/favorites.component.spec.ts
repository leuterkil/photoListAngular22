import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FavoritesStore } from '../../../../core/stores/favorites.store';
import { makePhoto } from '../../../../testing/photo.factory';
import { FavoritesComponent } from './favorites.component';

describe('FavoritesComponent', () => {
  let fixture: ComponentFixture<FavoritesComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  const create = () => {
    fixture = TestBed.createComponent(FavoritesComponent);
    fixture.detectChanges();
  };

  it('shows the empty message when there are no favorites', () => {
    create();

    expect(el().querySelector('.empty')?.textContent).toContain('No favorites yet');
    expect(el().querySelectorAll('photo-card').length).toBe(0);
  });

  it('lists every favorite as a link to its photo page', () => {
    const store = TestBed.inject(FavoritesStore);
    store.toggle(makePhoto('1'));
    store.toggle(makePhoto('2'));
    create();

    const hrefs = Array.from(el().querySelectorAll('photo-card a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/photos/1', '/photos/2']);
    expect(el().querySelector('.empty')).toBeNull();
  });

  it('removes a card as soon as it is un-favorited', () => {
    const store = TestBed.inject(FavoritesStore);
    store.toggle(makePhoto('1'));
    create();

    store.toggle(makePhoto('1'));
    fixture.detectChanges();

    expect(el().querySelectorAll('photo-card').length).toBe(0);
    expect(el().querySelector('.empty')).not.toBeNull();
  });
});
