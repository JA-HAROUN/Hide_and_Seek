import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimplexTableau } from './simplex-tableau';

describe('SimplexTableau', () => {
  let component: SimplexTableau;
  let fixture: ComponentFixture<SimplexTableau>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimplexTableau],
    }).compileComponents();

    fixture = TestBed.createComponent(SimplexTableau);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
