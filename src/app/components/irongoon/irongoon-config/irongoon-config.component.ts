import { Component, ElementRef, ViewChild } from '@angular/core';
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
  @ViewChild('configOutputElement') configOutputElement!: ElementRef;

  constructor(
    private irongoonService: IrongoonService,
    private clipboardService: ClipboardService
  ) {}

  copyConfigOutputToClipboard() {
    this.clipboardService.copyFromContent(this.configOutputElement.nativeElement.innerText);
  }

  displayConfigList() {
    return this.irongoonService.getConfigList();
  }
}
