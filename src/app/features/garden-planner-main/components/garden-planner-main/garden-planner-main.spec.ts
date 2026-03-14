import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GardenPlannerMain } from './garden-planner-main';

describe('GardenPlannerMain', () => {
  let component: GardenPlannerMain;
  let fixture: ComponentFixture<GardenPlannerMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GardenPlannerMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GardenPlannerMain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
