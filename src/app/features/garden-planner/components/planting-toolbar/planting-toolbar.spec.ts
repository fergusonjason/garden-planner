import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantingToolbar } from './planting-toolbar';

describe('PlantingToolbar', () => {
  let component: PlantingToolbar;
  let fixture: ComponentFixture<PlantingToolbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlantingToolbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlantingToolbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
