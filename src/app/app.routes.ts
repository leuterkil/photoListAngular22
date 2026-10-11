import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        
        path: '', 
        title: 'Photos | Stillframe', 
        loadComponent: () => import('./features/photos/components/photos/photos.component').then(m => m.PhotosComponent)
    }
];
