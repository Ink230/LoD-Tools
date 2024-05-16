import { Component, ElementRef, viewChild } from '@angular/core';
import { ClipboardModule, ClipboardService } from 'ngx-clipboard';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-config',
  standalone: true,
  imports: [ClipboardModule],
  templateUrl: './irongoon-config.component.html',
  styleUrl: './irongoon-config.component.css',
  providers: [IrongoonService],
})
export class IrongoonConfigComponent {
  configOutputElement = viewChild<ElementRef>('configOutputElement');

  constructor(
    private irongoonService: IrongoonService,
    private clipboardService: ClipboardService
  ) {}

  copyConfigOutputToClipboard() {
    this.clipboardService.copyFromContent(this.configOutputElement().nativeElement.innerText);
  }

  displayConfigList() {
    return this.irongoonService.getConfigList();
  }
}
