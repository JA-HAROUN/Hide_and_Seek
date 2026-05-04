import { Component, OnDestroy } from '@angular/core';
import { Box } from '../box/box';
import { GameData } from '../../services/game-data';
import { MapSize } from '../../models/map-size';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-matrix-generator',
  imports: [],
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
