import { TestBed } from '@angular/core/testing';

import { Controller } from './controller';

describe('Controller', () => {
  let service: Controller;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Controller);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
