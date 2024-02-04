import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresetsIrongoonComponent } from './presets-irongoon.component';

describe('PresetsIrongoonComponent', () => {
  let component: PresetsIrongoonComponent;
  let fixture: ComponentFixture<PresetsIrongoonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PresetsIrongoonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PresetsIrongoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
