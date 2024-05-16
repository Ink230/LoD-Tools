import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IrongoonCategoryComponent } from './irongoon-category/irongoon-category.component';
import { IrongoonConfigComponent } from './irongoon-config/irongoon-config.component';
import { IrongoonMacroComponent } from './irongoon-macro/irongoon-macro.component';
import { IrongoonNavigationComponent } from './irongoon-navigation/irongoon-navigation.component';
import { IrongoonSupportComponent } from './irongoon-support/irongoon-support.component';

@Component({
  selector: 'app-irongoon',
  templateUrl: './irongoon.component.html',
  styleUrls: ['./irongoon.component.css'],
  standalone: true,
  imports: [NgClass, FormsModule, IrongoonCategoryComponent, IrongoonSupportComponent, IrongoonConfigComponent, IrongoonMacroComponent, IrongoonNavigationComponent],
})
export class IrongoonComponent {}
