import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemsIrongoonComponent } from './items-irongoon.component';

describe('ItemsIrongoonComponent', () => {
  let component: ItemsIrongoonComponent;
  let fixture: ComponentFixture<ItemsIrongoonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemsIrongoonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ItemsIrongoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
