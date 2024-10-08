import { Component } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import { AgChartOptions } from 'ag-charts-community';

@Component({
  selector: 'app-graph-display',
  standalone: true,
  imports: [AgCharts],
  templateUrl: './graph-display.component.html',
  styleUrl: './graph-display.component.css',
})
export class GraphDisplayComponent {
  public chartOptions: AgChartOptions;
  constructor() {
    this.chartOptions = {
      data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
      ],

      series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' }],
    };
  }
}
