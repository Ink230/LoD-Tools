import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IrongoonConfigComponent } from './irongoon-config/irongoon-config.component';
import { IrongoonMacroComponent } from './irongoon-macro/irongoon-macro.component';
import { IrongoonNavigationComponent } from './irongoon-navigation/irongoon-navigation.component';
import { IrongoonSupportComponent } from './irongoon-support/irongoon-support.component';

@Component({
  selector: 'app-irongoon',
  templateUrl: './irongoon.component.html',
  styleUrls: ['./irongoon.component.css'],
  imports: [FormsModule, IrongoonSupportComponent, IrongoonConfigComponent, IrongoonMacroComponent, IrongoonNavigationComponent],
})
export class IrongoonComponent {}
