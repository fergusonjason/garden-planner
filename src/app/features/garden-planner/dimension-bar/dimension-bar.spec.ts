import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DimensionBar } from './dimension-bar';

describe('DimensionBar', () => {
  let component: DimensionBar;
  let fixture: ComponentFixture<DimensionBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DimensionBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DimensionBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
