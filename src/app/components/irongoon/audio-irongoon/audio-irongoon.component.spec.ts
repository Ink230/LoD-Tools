import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioIrongoonComponent } from './audio-irongoon.component';

describe('AudioIrongoonComponent', () => {
  let component: AudioIrongoonComponent;
  let fixture: ComponentFixture<AudioIrongoonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioIrongoonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AudioIrongoonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
