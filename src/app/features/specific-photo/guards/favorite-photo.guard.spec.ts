import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, UrlTree } from '@angular/router';
import { FavoritesStore } from '../../../core/stores/favorites.store';
import { makePhoto } from '../../../testing/photo.factory';
import { favoritePhotoGuard } from './favorite-photo.guard';

describe('favoritePhotoGuard', () => {
  beforeEach(() => localStorage.clear());

  const run = (id: string | null) => {
    const route = { paramMap: convertToParamMap(id === null ? {} : { id }) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => favoritePhotoGuard(route, {} as never));
  };

  it('allows a favorited photo', () => {
    TestBed.inject(FavoritesStore).toggle(makePhoto('5'));

    expect(run('5')).toBe(true);
  });

  it('redirects to the photo list when the photo is not a favorite', () => {
    const result = run('99') as UrlTree;

    expect(result.toString()).toBe(TestBed.inject(Router).createUrlTree(['/']).toString());
  });

  it('redirects when the id is missing', () => {
    expect(run(null)).toBeInstanceOf(UrlTree);
  });
});
