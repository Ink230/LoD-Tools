import { Component, OnInit, input } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import { AgChartOptions } from 'ag-charts-community';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-graph-display',
  standalone: true,
  imports: [AgCharts],
  templateUrl: './graph-display.component.html',
  styleUrl: './graph-display.component.css',
})
export class GraphDisplayComponent implements OnInit {
  chartOptionsData = input<BehaviorSubject<any>>();
  chartOptionsSeries = input<BehaviorSubject<any>>();
  chartOptions: AgChartOptions = {};

  subscriptions: Subscription = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.chartOptionsData().subscribe((data) => {
        this.updateChartOptions(data, this.chartOptionsSeries().getValue());
      })
    );

    this.subscriptions.add(
      this.chartOptionsSeries().subscribe((series) => {
        this.updateChartOptions(this.chartOptionsData().getValue(), series);
      })
    );

    this.updateChartOptions(this.chartOptionsData().getValue(), this.chartOptionsSeries().getValue());
  }

  private updateChartOptions(data: any, series: any): void {
    this.chartOptions = {
      theme: 'ag-material-dark',
      data: data,
      series: series,
      background: {
        fill: '#262c2e',
      },
    };
  }
}
