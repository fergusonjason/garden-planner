import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogShell } from './dialog-shell';

describe('DialogShell', () => {
  let component: DialogShell;
  let fixture: ComponentFixture<DialogShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
