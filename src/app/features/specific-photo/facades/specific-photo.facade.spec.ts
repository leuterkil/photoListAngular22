import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { FavoritesStore } from '../../../core/stores/favorites.store';
import { makePhoto } from '../../../testing/photo.factory';
import { SpecificPhotoFacade } from './specific-photo.facade';

describe('SpecificPhotoFacade', () => {
  let facade: SpecificPhotoFacade;
  let favorites: InstanceType<typeof FavoritesStore>;
  let params: BehaviorSubject<ParamMap>;
  const navigate = vi.fn();

  const setId = (id: string) => params.next(convertToParamMap({ id }));

  beforeEach(() => {
    localStorage.clear();
    navigate.mockReset();
    params = new BehaviorSubject(convertToParamMap({ id: '4' }));
    TestBed.configureTestingModule({
      providers: [
        SpecificPhotoFacade,
        { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    favorites = TestBed.inject(FavoritesStore);
    favorites.toggle(makePhoto('4'));
    facade = TestBed.inject(SpecificPhotoFacade);
  });

  describe('photo', () => {
    it('is the favorite matching the route id', () => {
      expect(facade.photo()).toEqual(makePhoto('4'));
    });

    it('is undefined when the id is not a favorite', () => {
      setId('404');

      expect(facade.photo()).toBeUndefined();
    });

    it('follows the route when the id changes', () => {
      favorites.toggle(makePhoto('5'));

      setId('5');

      expect(facade.photo()?.id).toBe('5');
    });

    it('becomes undefined once the photo is un-favorited', () => {
      favorites.toggle(makePhoto('4'));

      expect(facade.photo()).toBeUndefined();
    });

    it('is undefined when the route has no id', () => {
      params.next(convertToParamMap({}));

      expect(facade.photo()).toBeUndefined();
    });
  });

  describe('removeFavorite', () => {
    it('removes the photo from favorites', () => {
      facade.removeFavorite();

      expect(favorites.ids().has('4')).toBe(false);
    });

    it('persists the removal', () => {
      facade.removeFavorite();

      expect(JSON.parse(localStorage.getItem('photolist.favorites')!)).toEqual([]);
    });

    it('navigates to the favorites list afterwards', () => {
      facade.removeFavorite();

      expect(navigate).toHaveBeenCalledWith(['/favorites']);
    });

    it('keeps the other favorites', () => {
      favorites.toggle(makePhoto('5'));

      facade.removeFavorite();

      expect(favorites.photos().map((photo) => photo.id)).toEqual(['5']);
    });

    it('does nothing when the photo is not a favorite', () => {
      setId('404');

      facade.removeFavorite();

      expect(favorites.photos().map((photo) => photo.id)).toEqual(['4']);
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
