import { NgClass } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { IrongoonNavigationTab } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';
import { IrongoonCategoryComponent } from '../irongoon-category/irongoon-category.component';

@Component({
  selector: 'app-irongoon-navigation',
  imports: [NgClass, IrongoonCategoryComponent],
  templateUrl: './irongoon-navigation.component.html',
  styleUrl: './irongoon-navigation.component.css',
})
export class IrongoonNavigationComponent {
  private irongoonService = inject(IrongoonService);

  selectedTab = signal(1);

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
