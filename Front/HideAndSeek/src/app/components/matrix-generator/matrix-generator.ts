import { Component, OnDestroy } from '@angular/core';
import { Box } from '../box/box';
import { generateMockMatrix } from '../box/mock-matrix';
import { GameData } from '../../services/game-data';
import { MapSize } from '../../models/map-size';
import { Subscription } from 'rxjs';
import { BoxData } from '../../models/box-data';

@Component({
  selector: 'app-matrix-generator',
  imports: [Box],
  templateUrl: './matrix-generator.html',
  styleUrl: './matrix-generator.css',
})
export class MatrixGenerator implements OnDestroy {

  // 2. Use the data interface instead of the Component class
  matrix: BoxData[][] = [];
  private sub: Subscription | null = null;

  constructor(private gameData: GameData) {
    this.matrix = [];

    let isDemo = false;
    try {
      const params = new URLSearchParams(window.location.search);
      isDemo = params.get('demo') === 'true';
    } catch (e) {}

    this.sub = this.gameData.getSize().subscribe((s: MapSize) => {
      if (s.rows > 0 && s.columns > 0) {
        this.generateMatrix(s.rows, s.columns);
        // if (isDemo) {
          this.setMatrixValues(generateMockMatrix(s.rows, s.columns));
       //}
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // 3. Generate plain data objects, NOT 'new Box()'
  generateMatrix(rows: number, columns: number) {
    this.matrix = [];
    let counter = 1;
    for (let i = 0; i < rows; i++) {
      this.matrix[i] = [];
      for (let j = 0; j < columns; j++) {

        this.matrix[i][j] = { value: counter++, hider: false };
      }
    }
  }

  // 4. Update the values in the plain objects
  setMatrixValues(values: { value: number, hider: boolean }[][]) {
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values[i].length; j++) {
        this.matrix[i][j].value = values[i][j].value;
        this.matrix[i][j].hider = values[i][j].hider;
      }
    }
  }
}
