import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IrongoonComponent } from './components/irongoon/irongoon.component';

const routes: Routes = [
  {
    path: '',
    component: IrongoonComponent,
  },
  {
    path: 'irongoon',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
