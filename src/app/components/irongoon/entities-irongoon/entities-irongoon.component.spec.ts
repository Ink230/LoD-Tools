import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitiesIrongoonComponent } from './entities-irongoon.component';

describe('EntitiesIrongoonComponent', () => {
  let component: EntitiesIrongoonComponent;
  let fixture: ComponentFixture<EntitiesIrongoonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntitiesIrongoonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EntitiesIrongoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
