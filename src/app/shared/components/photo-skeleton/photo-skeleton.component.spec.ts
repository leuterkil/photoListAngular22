import { TestBed } from '@angular/core/testing';
import { PhotoSkeletonComponent } from './photo-skeleton.component';

describe('PhotoSkeletonComponent', () => {
  it('renders the image and fab placeholders', () => {
    const fixture = TestBed.createComponent(PhotoSkeletonComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.skeleton-image')).not.toBeNull();
    expect(el.querySelector('.skeleton-fab')).not.toBeNull();
  });
});
