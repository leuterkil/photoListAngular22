import { Photo } from '../core/types/photo.types';

/** Builds a `Photo` for tests; override any field as needed. */
export const makePhoto = (id = '1', overrides: Partial<Photo> = {}): Photo => ({
  id,
  author: `Author ${id}`,
  width: 600,
  height: 750,
  url: `https://picsum.photos/id/${id}/600/750`,
  largeUrl: `https://picsum.photos/id/${id}/1600/900`,
  ...overrides,
});
