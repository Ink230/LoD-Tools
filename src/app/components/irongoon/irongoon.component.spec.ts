import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IrongoonComponent } from './irongoon.component';

describe('IrongoonComponent', () => {
  let component: IrongoonComponent;
  let fixture: ComponentFixture<IrongoonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [IrongoonComponent]
});
    fixture = TestBed.createComponent(IrongoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
