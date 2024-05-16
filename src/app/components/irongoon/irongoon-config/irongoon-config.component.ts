import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { ClipboardModule, ClipboardService } from 'ngx-clipboard';
import { Subscription } from 'rxjs';
import { IrongoonConfigOption } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
  selector: 'app-irongoon-config',
  standalone: true,
  imports: [ClipboardModule, CommonModule],
  templateUrl: './irongoon-config.component.html',
  styleUrl: './irongoon-config.component.css',
})
export class IrongoonConfigComponent implements OnInit, OnDestroy {
  configOutputElement = viewChild<ElementRef>('configOutputElement');
  configList = signal<IrongoonConfigOption[]>(null);
  toggleColor = signal<boolean>(false);
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
    this.toggleColor.set(JSON.parse(localStorage.getItem('config-color')) ?? false);
  }

  copyConfigOutputToClipboard() {
    this.clipboardService.copyFromContent(this.configOutputElement().nativeElement.innerText.toString().replace(/:\n/g, ': '));
  }

  getConfigList() {
    return this.irongoonService.getConfigList();
  }

  isHeader(value: string): boolean {
    return value && value.length && value[0] === '#';
  }

  onDblClick(event: MouseEvent) {
    const div = event.target as HTMLElement;
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(div);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  toggle() {
    this.toggleColor.set(!this.toggleColor());
    localStorage.setItem('config-color', JSON.stringify(this.toggleColor()));
  }

  ngOnDestroy() {
    this.irongoonOptionSubscription.unsubscribe();
  }
}
