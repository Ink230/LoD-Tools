import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms';
import { ClipboardModule } from 'ngx-clipboard';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IrongoonDropdownComponent } from './components/irongoon-dropdown/irongoon-dropdown.component';
import { DisplayCategoryIrongoonComponent } from './components/irongoon/display-category-irongoon/display-category-irongoon.component';
import { IrongoonComponent } from './components/irongoon/irongoon.component';
import { IrongoonService } from './services/irongoon.service';

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, AppRoutingModule, ClipboardModule, FormsModule, IrongoonComponent, DisplayCategoryIrongoonComponent, IrongoonDropdownComponent],
    providers: [IrongoonService],
    bootstrap: [AppComponent],
})
export class AppModule {}
