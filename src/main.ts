import { bootstrapApplication } from '@angular/platform-browser';
import { Routes, provideRouter } from '@angular/router';
import { AppComponent } from './app/components/app-default/app.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'mods/irongoon',
    pathMatch: 'full',
  },
  {
    path: 'mods',
    children: [
      {
        path: 'irongoon',
        loadComponent: () => import('./app/components/irongoon/irongoon.component').then((m) => m.IrongoonComponent),
      },
    ],
  },
  {
    path: 'data',
    loadComponent: () => import('./app/components/game-data/game-data.component').then((m) => m.GameDataComponent),
    children: [
      {
        path: 'summary',
        loadComponent: () => import('./app/components/game-data/summary-list/summary-list.component').then((m) => m.SummaryListComponent),
      },
      {
        path: 'character',
        redirectTo: 'character/dart',
      },
      {
        path: 'character/:selectedCharacter',
        loadComponent: () => import('./app/components/game-data/character-data/character-data.component').then((m) => m.CharacterDataComponent),
      },
      {
        path: 'character-comparison',
        loadComponent: () => import('./app/components/game-data/character-comparison/character-comparison.component').then((m) => m.CharacterComparisonComponent),
      },
    ],
  },
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes)],
}).catch((err) => console.error(err));
