import { GridOptions } from '@ag-grid-community/core';
import { Component, OnInit, input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
    selector: 'app-grid-display',
    imports: [AgGridAngular],
    templateUrl: './grid-display.component.html',
    styleUrl: './grid-display.component.css'
})
export class GridDisplayComponent implements OnInit {
  rowData = input<any>();
  colDefs = input<any>();
  gridOptions = input<any>();
  gridOptionsDefault: GridOptions = {
    defaultColDef: {
      resizable: true,
    },
    autoSizeStrategy: {
      type: 'fitGridWidth',
      defaultMinWidth: 40,
    },
  };

  ngOnInit(): void {}
}
