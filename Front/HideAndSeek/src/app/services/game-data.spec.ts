import { TestBed } from '@angular/core/testing';

import { GameData } from './game-data';

describe('GameData', () => {
  let service: GameData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
