import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClipboardModule, ClipboardService } from 'ngx-clipboard';
import { Subscription } from 'rxjs';
import { NumericInputDirective } from 'src/app/directives/numeric-input.directive';
import { IrongoonConfigOption } from 'src/app/models/irongoon.model';
import { IrongoonService } from 'src/app/services/irongoon.service';

@Component({
    selector: 'app-irongoon-config',
    imports: [ClipboardModule, CommonModule, FormsModule, NumericInputDirective],
    templateUrl: './irongoon-config.component.html',
    styleUrl: './irongoon-config.component.css'
})
export class IrongoonConfigComponent implements OnInit, OnDestroy {
  configOutputElement = viewChild<ElementRef>('configOutputElement');
  configList = signal<IrongoonConfigOption[]>(null);
  toggleColor = signal<boolean>(false);
  inputUpperBound = signal<number>(this.irongoonService.numberInputUpperBound);
  inputLowerBound = signal<number>(this.irongoonService.numberInputLowerBound);
  private irongoonOptionSubscription: Subscription;

  constructor(
    private irongoonService: IrongoonService,
    private clipboardService: ClipboardService
  ) {
    this.irongoonOptionSubscription = this.irongoonService.getOptionUpdate().subscribe((msg) => {
      this.configList.set(this.getConfigList());
      this.inputUpperBound.set(this.irongoonService.numberInputUpperBound);
      this.inputLowerBound.set(this.irongoonService.numberInputLowerBound);
    });
  }

  ngOnInit() {
    this.configList.set(this.getConfigList());
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

  // Broken
  onDblClick(event: MouseEvent) {
    const div = event.target as HTMLElement;
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(div);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  updateUpperBound(value: number) {
    this.irongoonService.numberInputUpperBound = value;
  }

  updateLowerBound(value: number) {
    this.irongoonService.numberInputLowerBound = value;
  }

  onFocusHighlightText(inputElement: HTMLInputElement) {
    inputElement.select();
  }

  ngOnDestroy() {
    this.irongoonOptionSubscription.unsubscribe();
  }
}
