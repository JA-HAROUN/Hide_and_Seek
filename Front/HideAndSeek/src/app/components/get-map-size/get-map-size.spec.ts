import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetMapSize } from './get-map-size';

describe('GetMapSize', () => {
  let component: GetMapSize;
  let fixture: ComponentFixture<GetMapSize>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetMapSize],
    }).compileComponents();

    fixture = TestBed.createComponent(GetMapSize);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
