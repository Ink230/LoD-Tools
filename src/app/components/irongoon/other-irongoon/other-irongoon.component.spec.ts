import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherIrongoonComponent } from './other-irongoon.component';

describe('OtherIrongoonComponent', () => {
  let component: OtherIrongoonComponent;
  let fixture: ComponentFixture<OtherIrongoonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherIrongoonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OtherIrongoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
