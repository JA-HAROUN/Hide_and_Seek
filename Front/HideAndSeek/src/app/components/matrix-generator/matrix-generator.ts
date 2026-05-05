import { Component, OnDestroy } from '@angular/core';
import { Box } from '../box/box';
import { generateMockMatrix } from '../box/mock-matrix';
import { GameData } from '../../services/game-data';
import { MapSize } from '../../models/map-size';
import { Subscription } from 'rxjs';
import { BoxData } from '../../models/box-data';
import {Controller} from '../../services/controller';

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

  constructor(private gameData: GameData, private controller: Controller) {
    this.matrix = [];

    this.sub = this.gameData.getSize().subscribe(async (s: MapSize) => {
      if (s.rows > 0 && s.columns > 0) {

        // 1. Generate an empty safe grid first (so the UI doesn't crash)
        this.generateMatrix(s.rows, s.columns);

        // 2. Ask the backend for the REAL data
        const role = this.gameData.getCurrentRole() || 'seeker';
        const realGrid = await this.controller.startGame(s.rows, s.columns, role);

        // 3. Update the UI boxes with the real hider locations!
        if (realGrid) {
          this.setMatrixValues(realGrid);
        }
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

  protected handleBoxClick(rowIndex: number, colIndex: number) {
    console.log(`Sending move to backend: Row ${rowIndex}, Col ${colIndex}`);
    this.controller.revealBox(rowIndex, colIndex);
  }
}
