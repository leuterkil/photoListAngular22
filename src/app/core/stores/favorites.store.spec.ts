import { TestBed } from '@angular/core/testing';
import { makePhoto } from '../../testing/photo.factory';
import { FavoritesStore } from './favorites.store';

const KEY = 'photolist.favorites';

describe('FavoritesStore', () => {
  beforeEach(() => localStorage.clear());

  const create = () => TestBed.inject(FavoritesStore);

  it('starts empty when nothing is saved', () => {
    expect(create().photos()).toEqual([]);
  });

  it('adds a photo and exposes its id', () => {
    const store = create();
    store.toggle(makePhoto('1'));

    expect(store.photos().map((p) => p.id)).toEqual(['1']);
    expect(store.ids().has('1')).toBe(true);
  });

  it('removes a photo when toggled a second time', () => {
    const store = create();
    store.toggle(makePhoto('1'));
    store.toggle(makePhoto('1'));

    expect(store.photos()).toEqual([]);
    expect(store.ids().has('1')).toBe(false);
  });

  it('keeps other favorites when one is removed', () => {
    const store = create();
    store.toggle(makePhoto('1'));
    store.toggle(makePhoto('2'));
    store.toggle(makePhoto('1'));

    expect(store.photos().map((p) => p.id)).toEqual(['2']);
  });

  it('persists every change to localStorage', () => {
    const store = create();
    store.toggle(makePhoto('1'));
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([makePhoto('1')]);

    store.toggle(makePhoto('1'));
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([]);
  });

  it('restores favorites saved before a page refresh', () => {
    localStorage.setItem(KEY, JSON.stringify([makePhoto('7'), makePhoto('8')]));

    const store = create();

    expect(store.photos().map((p) => p.id)).toEqual(['7', '8']);
    expect(store.ids().has('7')).toBe(true);
  });

  it('falls back to an empty list when the saved value is corrupt', () => {
    localStorage.setItem(KEY, '{not json');

    expect(create().photos()).toEqual([]);
  });

  it('keeps working in memory when localStorage throws on write', () => {
    const store = create();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => store.toggle(makePhoto('1'))).not.toThrow();
    expect(store.ids().has('1')).toBe(true);

    vi.restoreAllMocks();
  });
});
