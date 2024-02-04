import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { ClipboardModule } from 'ngx-clipboard';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IrongoonComponent } from './components/irongoon/irongoon.component';
import { IrongoonService } from './services/iroongoon.service';

@NgModule({
  declarations: [AppComponent, IrongoonComponent],
  imports: [BrowserModule, AppRoutingModule, ClipboardModule],
  providers: [IrongoonService],
  bootstrap: [AppComponent],
})
export class AppModule {}
