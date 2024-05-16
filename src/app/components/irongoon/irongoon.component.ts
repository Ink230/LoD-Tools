import { NgClass } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IrongoonNavigationTab } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';
import { IrongoonCategoryComponent } from './irongoon-category/irongoon-category.component';
import { IrongoonConfigComponent } from './irongoon-config/irongoon-config.component';
import { IrongoonMacroComponent } from './irongoon-macro/irongoon-macro.component';
import { IrongoonSupportComponent } from './irongoon-support/irongoon-support.component';

@Component({
  selector: 'app-irongoon',
  templateUrl: './irongoon.component.html',
  styleUrls: ['./irongoon.component.css'],
  standalone: true,
  imports: [NgClass, FormsModule, IrongoonCategoryComponent, IrongoonSupportComponent, IrongoonConfigComponent, IrongoonMacroComponent],
  providers: [IrongoonService],
})
export class IrongoonComponent {
  selectedTab = signal(0);

  constructor(private irongoonService: IrongoonService) {}

  getNavigationTabs(): IrongoonNavigationTab[] {
    return this.irongoonService.optionCategories.map((entry) => ({ id: entry.id, title: entry.name }));
  }

  updateSelectedTab(id: number): void {
    this.selectedTab.set(id);
  }

  isSelectedTab(id: number): boolean {
    return id == this.selectedTab();
  }
}
