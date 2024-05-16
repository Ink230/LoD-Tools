import { NgClass } from '@angular/common';
import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClipboardModule, ClipboardService } from 'ngx-clipboard';
import { IrongoonNavigationTab } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';
import { IrongoonCategoryComponent } from './irongoon-category/irongoon-category.component';
import { IrongoonSupportComponent } from './irongoon-support/irongoon-support.component';

@Component({
  selector: 'app-irongoon',
  templateUrl: './irongoon.component.html',
  styleUrls: ['./irongoon.component.css'],
  standalone: true,
  imports: [NgClass, ClipboardModule, FormsModule, IrongoonCategoryComponent, IrongoonSupportComponent],
  providers: [IrongoonService],
})
export class IrongoonComponent {
  @ViewChild('configOutputElement') configOutputElement!: ElementRef;

  selectedTab = signal(0);

  constructor(
    private irongoonService: IrongoonService,
    private clipboardService: ClipboardService
  ) {}

  getNavigationTabs(): IrongoonNavigationTab[] {
    return this.irongoonService.optionCategories.map((entry) => ({ id: entry.id, title: entry.name }));
  }

  updateSelectedTab(id: number): void {
    this.selectedTab.set(id);
  }

  isSelectedTab(id: number): boolean {
    return id == this.selectedTab();
  }

  copyConfigOutputToClipboard() {
    this.clipboardService.copyFromContent(this.configOutputElement.nativeElement.innerText);
  }

  randomizeRandomizer() {
    this.irongoonService.randomizeOptionCategories();
  }

  resetRandomizer() {
    this.irongoonService.resetOptionCategories();
  }

  displayConfigList() {
    return this.irongoonService.configList;
  }
}
