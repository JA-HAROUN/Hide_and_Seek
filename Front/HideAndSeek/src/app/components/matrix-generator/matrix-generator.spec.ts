import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixGenerator } from './matrix-generator';

describe('MatrixGenerator', () => {
  let component: MatrixGenerator;
  let fixture: ComponentFixture<MatrixGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixGenerator],
    }).compileComponents();

    fixture = TestBed.createComponent(MatrixGenerator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
