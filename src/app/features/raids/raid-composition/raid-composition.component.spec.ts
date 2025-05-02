import {ComponentFixture, TestBed} from '@angular/core/testing';

import {RaidCompositionComponent} from './raid-composition.component';

describe('RaidCompositionComponent', () => {
  let component: RaidCompositionComponent;
  let fixture: ComponentFixture<RaidCompositionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RaidCompositionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RaidCompositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
