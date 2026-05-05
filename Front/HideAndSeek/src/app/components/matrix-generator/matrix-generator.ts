import { Component, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { Box } from '../box/box';
import { GameData } from '../../services/game-data';
import { MapSize } from '../../models/map-size';
import { Subscription } from 'rxjs';
import { BoxData } from '../../models/box-data';
import { Controller } from '../../services/controller';

@Component({
  selector: 'app-matrix-generator',
  imports: [Box],
  templateUrl: './matrix-generator.html',
  styleUrl: './matrix-generator.css',
})
export class MatrixGenerator implements OnDestroy {

  matrix: BoxData[][] = [];
  currentRole: string = 'seeker';
  private sub: Subscription | null = null;

  @ViewChildren(Box) boxComponents!: QueryList<Box>;

  constructor(private gameData: GameData, private controller: Controller) {
    this.matrix = [];

    this.sub = this.gameData.getSize().subscribe(async (s: MapSize) => {
      if (s.rows > 0 && s.columns > 0) {
        this.generateMatrix(s.rows, s.columns);

        // FIX: Update the class property 'this.currentRole' directly!
        this.currentRole = this.gameData.getCurrentRole() || 'seeker';

        // Use 'this.currentRole' here instead of a local variable
        const realGrid = await this.controller.startGame(s.rows, s.columns, this.currentRole);

        if (realGrid) {
          this.setMatrixValues(realGrid);
        }
      }
    });
  }

  async handleBoxClick(row: number, col: number) {
    if (this.currentRole === 'seeker') {
      this.controller.revealBox(row, col);
    }
    else if (this.currentRole === 'hider') {
      console.log(`User hid treasure at Row ${row}, Col ${col}`);

      const computerGuess = await this.controller.playHiderTurn(row, col);

      if (computerGuess) {
        this.animateComputerMove(computerGuess.row, computerGuess.col, computerGuess.found);
      }
    }
  }

  animateComputerMove(targetRow: number, targetCol: number, foundTreasure: boolean) {
    const columns = this.matrix[0].length;
    const boxIndex = (targetRow * columns) + targetCol;

    const targetBox = this.boxComponents.toArray()[boxIndex];
    if (targetBox) {
      targetBox.animateComputerGuess(foundTreasure);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

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

  setMatrixValues(values: { value: number, hider: boolean }[][]) {
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values[i].length; j++) {
        this.matrix[i][j].value = values[i][j].value;
        this.matrix[i][j].hider = values[i][j].hider;
      }
    }
  }
}
