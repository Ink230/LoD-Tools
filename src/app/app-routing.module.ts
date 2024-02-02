import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IrongoonComponent } from './components/irongoon/irongoon.component';

const routes: Routes = [{ path: 'test', component: IrongoonComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
