import { TestBed } from '@angular/core/testing';
import { FavoritesStore } from '../../../core/stores/favorites.store';
import { makePhoto } from '../../../testing/photo.factory';
import { FavoritesFacade } from './favorites.facade';

describe('FavoritesFacade', () => {
  let facade: FavoritesFacade;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [FavoritesFacade] });
    facade = TestBed.inject(FavoritesFacade);
  });

  it('exposes the app-wide favorites store', () => {
    expect(facade.store).toBe(TestBed.inject(FavoritesStore));
  });

  it('starts with no favorites', () => {
    expect(facade.store.photos()).toEqual([]);
  });

  it('reflects favorites that were added elsewhere', () => {
    TestBed.inject(FavoritesStore).toggle(makePhoto('1'));

    expect(facade.store.photos().map((photo) => photo.id)).toEqual(['1']);
  });

  it('restores favorites saved before a page refresh', () => {
    localStorage.setItem('photolist.favorites', JSON.stringify([makePhoto('9')]));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [FavoritesFacade] });

    expect(TestBed.inject(FavoritesFacade).store.photos().map((photo) => photo.id)).toEqual(['9']);
  });
});
