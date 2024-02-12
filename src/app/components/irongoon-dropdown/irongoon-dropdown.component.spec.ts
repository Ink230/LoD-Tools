import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IrongoonDropdownComponent } from './irongoon-dropdown.component';

describe('IrongoonDropdownComponent', () => {
  let component: IrongoonDropdownComponent;
  let fixture: ComponentFixture<IrongoonDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IrongoonDropdownComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IrongoonDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
