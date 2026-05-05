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

  isBoardFlipped: boolean = false;
  isWaitingForSequence: boolean = false;
  @ViewChildren(Box) boxComponents!: QueryList<Box>;

  constructor(private gameData: GameData, private controller: Controller) {
    this.matrix = [];

    this.sub = this.gameData.getSize().subscribe(async (s: MapSize) => {
      if (s.rows > 0 && s.columns > 0) {
        this.generateMatrix(s.rows, s.columns);

        // FIX: Update the class property 'this.currentRole' directly!
        this.currentRole = this.gameData.getCurrentRole() || 'seeker';

        if (this.currentRole === 'hider') {
          // Wait half a second after the board loads, then flip them all to plain side!
          setTimeout(() => this.isBoardFlipped = true, 500);
        }
        // Use 'this.currentRole' here instead of a local variable
        const realGrid = await this.controller.startGame(s.rows, s.columns, this.currentRole);

        if (realGrid) {
          this.setMatrixValues(realGrid);
        }
      }
    });
  }

  async handleBoxClick(row: number, col: number) {
    if (this.isWaitingForSequence) return; // Prevent double clicking during animation

    if (this.currentRole === 'seeker') {
      this.controller.revealBox(row, col);
    }
    else if (this.currentRole === 'hider') {
      if (!this.isBoardFlipped) return; // User must wait for the board to flip first

      this.isWaitingForSequence = true; // Lock the board
      console.log(`User hiding treasure at Row ${row}, Col ${col}`);

      // 1. Show the "burying treasure" animation on the clicked box
      const boxIndex = (row * this.matrix[0].length) + col;
      const targetBox = this.boxComponents.toArray()[boxIndex];
      targetBox.showBuryAnimation();

      // 2. Wait 1.2 seconds for the bury animation to finish, then FLIP BOARD BACK
      setTimeout(async () => {
        this.isBoardFlipped = false; // This rotates all boxes back to numbers

        // 3. Wait 0.8 seconds for the flip animation to finish, THEN ask computer to guess
        setTimeout(async () => {
          const computerGuess = await this.controller.playHiderTurn(row, col);

          if (computerGuess) {
            // 4. Smash the box the computer guessed!
            this.animateComputerMove(computerGuess.row, computerGuess.col, computerGuess.found);
          }
          this.isWaitingForSequence = false; // Unlock board
        }, 800);
      }, 1200);
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
