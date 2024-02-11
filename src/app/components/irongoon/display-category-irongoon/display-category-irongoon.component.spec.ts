import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayCategoryIrongoonComponent } from './display-category-irongoon.component';

describe('PresetsIrongoonComponent', () => {
  let component: DisplayCategoryIrongoonComponent;
  let fixture: ComponentFixture<DisplayCategoryIrongoonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayCategoryIrongoonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayCategoryIrongoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
