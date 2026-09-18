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
      theme: {
        baseTheme: 'ag-material-dark',
        params: {
          backgroundColor: '#111a14',
          chartBackgroundColor: '#111a14',
          foregroundColor: '#dce6df',
          textColor: '#dce6df',
          subtleTextColor: '#9aaa9f',
          accentColor: '#b8d99c',
          borderColor: '#2b3e31',
          axisLineColor: '#48604c',
          gridLineColor: '#2b3e31',
          chromeBackgroundColor: '#19281e',
          chromeTextColor: '#dce6df',
          chromeSubtleTextColor: '#9aaa9f',
          tooltipBackgroundColor: '#19281e',
          tooltipTextColor: '#dce6df',
          tooltipSubtleTextColor: '#9aaa9f',
          tooltipBorder: { color: '#48604c', width: 1 },
          fontFamily: ['system-ui', 'sans-serif'],
        },
      },
      data: data,
      series: series,
    });
  }
}
