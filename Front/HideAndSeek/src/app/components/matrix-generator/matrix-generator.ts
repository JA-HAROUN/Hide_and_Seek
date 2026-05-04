import { Component, OnDestroy } from '@angular/core';
import { Box } from '../box/box';
import { MOCK_MATRIX_VALUES } from '../box/mock-matrix';
import { GameData } from '../../services/game-data';
import { MapSize } from '../../models/map-size';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-matrix-generator',
  imports: [Box],
  templateUrl: './matrix-generator.html',
  styleUrl: './matrix-generator.css',
})
export class MatrixGenerator implements OnDestroy {

  matrix: Box[][] = [];
  private sub: Subscription | null = null;

  constructor(private gameData: GameData) {
    this.matrix = [];
    this.sub = this.gameData.getSize().subscribe((s: MapSize) => {
      if (s.rows > 0 && s.columns > 0) {
        this.generateMatrix(s.rows, s.columns);
      }
    });

    // If the URL contains ?demo=true, load the mock matrix values for testing
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === 'true') {
        const rows = MOCK_MATRIX_VALUES.length;
        const cols = MOCK_MATRIX_VALUES[0]?.length || 0;
        if (rows > 0 && cols > 0) {
          this.generateMatrix(rows, cols);
          this.setMatrixValues(MOCK_MATRIX_VALUES);
        }
      }
    } catch (e) {
      // ignore if window isn't available in some environments
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // Method to generate a matrix of Box objects based on the specified number of rows and columns
  generateMatrix(rows: number, columns: number) {
    this.matrix = [];
    for (let i = 0; i < rows; i++) {
      this.matrix[i] = [];
      for (let j = 0; j < columns; j++) {
        this.matrix[i][j] = new Box();
      }
    }
  }

  // Method to set the values of the matrix
  setMatrixValues(values: { value: number, hider: boolean }[][]) {
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values[i].length; j++) {
        this.matrix[i][j].setValue(values[i][j].value, values[i][j].hider);
      }
    }
  }

}
