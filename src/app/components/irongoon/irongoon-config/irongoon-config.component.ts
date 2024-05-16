import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { ClipboardModule, ClipboardService } from 'ngx-clipboard';
import { Subscription } from 'rxjs';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-config',
  standalone: true,
  imports: [ClipboardModule],
  templateUrl: './irongoon-config.component.html',
  styleUrl: './irongoon-config.component.css',
})
export class IrongoonConfigComponent implements OnInit, OnDestroy {
  configOutputElement = viewChild<ElementRef>('configOutputElement');
  configList = signal<string[]>(null);
  private irongoonOptionSubscription: Subscription;

  constructor(
    private irongoonService: IrongoonService,
    private clipboardService: ClipboardService
  ) {
    this.irongoonOptionSubscription = this.irongoonService.getOptionUpdate().subscribe((msg) => {
      this.configList.set(this.getConfigList());
    });
  }

  ngOnInit() {
    this.configList.set(this.getConfigList());
  }

  copyConfigOutputToClipboard() {
    this.clipboardService.copyFromContent(this.configOutputElement().nativeElement.innerText);
  }

  getConfigList() {
    return this.irongoonService.getConfigList();
  }

  onDblClick(event: MouseEvent) {
    const div = event.target as HTMLElement;
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(div);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  ngOnDestroy() {
    this.irongoonOptionSubscription.unsubscribe();
  }
}
