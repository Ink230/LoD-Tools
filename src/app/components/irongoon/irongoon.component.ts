import { Component, ElementRef, ViewChild } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { IrongoonSettingCategories } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/iroongoon.service';

@Component({
  selector: 'app-irongoon',
  templateUrl: './irongoon.component.html',
  styleUrls: ['./irongoon.component.css'],
})
export class IrongoonComponent {
  @ViewChild('configOutputElement') configOutputElement!: ElementRef;

  selectedTab = 0;

  constructor(
    private irongoonService: IrongoonService,
    private clipboardService: ClipboardService
  ) {}

  getNavigationTabs(): IrongoonSettingCategories[] {
    return this.irongoonService.settingCategories;
  }

  updateSelectedTab(id: number): void {
    this.selectedTab = id;
  }

  isSelectedTab(id: number): boolean {
    return id == this.selectedTab;
  }

  displayTabComponent() {
    return this.irongoonService.settingCategories[this.selectedTab].component;
  }

  copyConfigOutputToClipboard() {
    this.clipboardService.copyFromContent(this.configOutputElement.nativeElement.innerText);
  }
}
