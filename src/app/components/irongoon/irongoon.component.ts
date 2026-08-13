import { Component } from '@angular/core';
import { IrongoonConfigComponent } from './irongoon-config/irongoon-config.component';
import { IrongoonMacroComponent } from './irongoon-macro/irongoon-macro.component';
import { IrongoonNavigationComponent } from './irongoon-navigation/irongoon-navigation.component';
import { IrongoonSupportComponent } from './irongoon-support/irongoon-support.component';
import { IrongoonToggleComponent } from './irongoon-toggle/irongoon-toggle.component';

@Component({
  selector: 'app-irongoon',
  templateUrl: './irongoon.component.html',
  styleUrls: ['./irongoon.component.css'],
  imports: [IrongoonSupportComponent, IrongoonConfigComponent, IrongoonMacroComponent, IrongoonNavigationComponent, IrongoonToggleComponent],
})
export class IrongoonComponent {}
