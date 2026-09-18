import { bootstrapApplication } from '@angular/platform-browser';
import { Routes, RouteReuseStrategy, provideRouter } from '@angular/router';
import { EditorRouteReuseStrategy } from './app/services/editor-route-reuse.strategy';
import { AppComponent } from './app/components/app-default/app.component';

const routes: Routes = [
  {
    path: 'asset-viewer',
    data: { preserveEditorSession: true },
    loadComponent: () => import('./app/components/asset-viewer/asset-viewer.component').then((m) => m.AssetViewerComponent),
  },
  {
    path: 'world-map-editor',
    data: { preserveEditorSession: true },
    loadComponent: () => import('./app/components/world-map-editor/world-map-editor.component').then((m) => m.WorldMapEditorComponent),
  },
  {
    path: '',
    loadComponent: () => import('./app/components/mod-collection/mod-collection.component').then((m) => m.ModCollectionComponent),
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
      ...['dragoons', 'additions', 'spells', 'items', 'submaps', 'stages', 'encounters', 'enemies'].map(section => ({
        path: section,
        data: { section },
        loadComponent: () => import('./app/components/game-data/catalog/game-data-catalog.component').then(m => m.GameDataCatalogComponent),
      })),
    ],
  },
];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), { provide: RouteReuseStrategy, useClass: EditorRouteReuseStrategy }],
}).catch((err) => console.error(err));
