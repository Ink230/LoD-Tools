import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { ClipboardModule } from 'ngx-clipboard';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DisplayCategoryIrongoonComponent } from './components/irongoon/display-category-irongoon/display-category-irongoon.component';
import { IrongoonComponent } from './components/irongoon/irongoon.component';
import { IrongoonService } from './services/irongoon.service';

@NgModule({
  declarations: [AppComponent, IrongoonComponent, DisplayCategoryIrongoonComponent],
  imports: [BrowserModule, AppRoutingModule, ClipboardModule],
  providers: [IrongoonService],
  bootstrap: [AppComponent],
})
export class AppModule {}
