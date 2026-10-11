import { Routes } from '@angular/router';

import { favoritePhotoGuard } from './features/specific-photo/guards/favorite-photo.guard';

export const routes: Routes = [
    {
        
        path: '', 
        title: 'Photos | Stillframe', 
        loadComponent: () => import('./features/photos/components/photos/photos.component').then(m => m.PhotosComponent)
    },
    {
        path: 'favorites',
        title: 'Favorites | Stillframe',
        loadComponent: () => import('./features/favorites/components/favorites/favorites.component').then(m => m.FavoritesComponent)
    },
    {
        path: 'photos/:id',
        title: 'Photo | Stillframe',
        canActivate: [favoritePhotoGuard],
        loadComponent: () => import('./features/specific-photo/components/specific-photo/specific-photo.component').then(m => m.SpecificPhotoComponent)
    }
];
