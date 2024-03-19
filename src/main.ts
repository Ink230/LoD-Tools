import { bootstrapApplication } from '@angular/platform-browser';
import { Routes, provideRouter } from '@angular/router';
import { AppComponent } from './app/components/app-default/app.component';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app/components/irongoon/irongoon.component')
        .then(m => m.IrongoonComponent),
  },
  {
    path: 'irongoon',
    redirectTo: '',
  },
];

bootstrapApplication(AppComponent, 
    {
    providers: [
        provideRouter(routes)
    ]
}).catch(err => console.error(err));