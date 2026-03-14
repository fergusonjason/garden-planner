import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantingSelector } from './planting-selector';

describe('PlantingSelector', () => {
  let component: PlantingSelector;
  let fixture: ComponentFixture<PlantingSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlantingSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlantingSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
