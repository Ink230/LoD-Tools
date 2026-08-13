import { Component, OnInit, input, signal } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import { AgChartOptions, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';
import { BehaviorSubject, Subscription, auditTime, combineLatest } from 'rxjs';

ModuleRegistry.registerModules(AllCommunityModule);

@Component({
    selector: 'app-graph-display',
    imports: [AgCharts],
    templateUrl: './graph-display.component.html',
    styleUrl: './graph-display.component.css'
})
export class GraphDisplayComponent implements OnInit {
  chartOptionsData = input<BehaviorSubject<any>>();
  chartOptionsSeries = input<BehaviorSubject<any>>();
  large = input(false);
  chartOptions = signal<AgChartOptions>({});

  subscriptions: Subscription = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([this.chartOptionsData(), this.chartOptionsSeries()])
        .pipe(auditTime(0))
        .subscribe(([data, series]) => {
          this.updateChartOptions(data, series);
        })
    );
  }

  private updateChartOptions(data: any, series: any): void {
    this.chartOptions.set({
      theme: 'ag-material-dark',
      data: data,
      series: series,
      background: {
        fill: '#262c2e',
      },
    });
  }
}
