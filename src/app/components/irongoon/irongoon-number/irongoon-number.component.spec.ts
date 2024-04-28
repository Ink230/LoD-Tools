import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IrongoonNumberComponent } from './irongoon-number.component';

describe('IrongoonNumberComponent', () => {
  let component: IrongoonNumberComponent;
  let fixture: ComponentFixture<IrongoonNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IrongoonNumberComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IrongoonNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
