import { Component, OnInit, input } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-grid-display',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './grid-display.component.html',
  styleUrl: './grid-display.component.css',
})
export class GridDisplayComponent implements OnInit {
  rowData = input<any>();
  colDefs = input<ColDef[]>();
  gridOptions = input<GridOptions>();
  gridOptionsDefault: GridOptions = {
    defaultColDef: {
      resizable: true,
    },
    autoSizeStrategy: {
      type: 'fitGridWidth',
      defaultMinWidth: 100,
    },
  };

  ngOnInit(): void {}
}
