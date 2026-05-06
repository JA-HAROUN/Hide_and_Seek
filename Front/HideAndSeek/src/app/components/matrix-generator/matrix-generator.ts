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

  // Interaction State
  isBoardFlipped: boolean = false;
  isWaitingForSequence: boolean = false;

  // MISSING VARIABLES ADDED HERE:
  isSimulating: boolean = false;
  speedMultiplier: number = 1;
  simRound: number = 0;
  simLog: string[] = [];

  roundOver: boolean = false;
  // MISSING DELAY HELPER ADDED HERE:
  private delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  @ViewChildren(Box) boxComponents!: QueryList<Box>;

  constructor(
    private gameData: GameData,
    private controller: Controller,
  ) {
    this.matrix = [];

    this.sub = this.gameData.getSize().subscribe(async (s: MapSize) => {
      if (s.rows > 0 && s.columns > 0) {
        this.generateMatrix(s.rows, s.columns);
        this.currentRole = this.gameData.getCurrentRole() || 'seeker';

        // Set up the board based on the role
        if (this.currentRole === 'hider') {
          setTimeout(() => (this.isBoardFlipped = true), 500);
        }
        const useProx = this.gameData.getUseProximity();

        const realGrid = await this.controller.startGame(s.rows, s.columns, this.currentRole, useProx);
        if (realGrid) {
          this.setMatrixValues(realGrid);
        }
      }
    });
  }

  async startNextRound() {
    this.roundOver = false;
    this.isWaitingForSequence = false;

    this.boxComponents.forEach(box => box.resetBox());

    if (this.currentRole === 'hider') {
      setTimeout(() => { this.isBoardFlipped = true; }, 100);
    }

    const newGrid = await this.controller.nextRound(this.currentRole);
    if (newGrid) {
      this.setMatrixValues(newGrid);
    }
  }
  // MISSING SPEED/STOP METHODS ADDED HERE:
  setSpeed(speed: number) {
    this.speedMultiplier = speed;
  }

  stopSimulation() {
    this.isSimulating = false;
  }

  private getBoxComponent(row: number, col: number) {
    const columns = this.matrix[0].length;
    const index = row * columns + col;
    return this.boxComponents.toArray()[index];
  }

  async handleBoxClick(row: number, col: number) {
    if (this.isWaitingForSequence || this.roundOver) return;

    if (this.currentRole === 'seeker') {
      this.isWaitingForSequence = true; // Lock the board
      await this.controller.revealBox(row, col);

      // Wait 3 seconds for smash/bomb animation to finish, then show Next Round button
      setTimeout(() => {
        this.roundOver = true;
      }, 3000);
    }
    else if (this.currentRole === 'hider') {
      if (!this.isBoardFlipped) return;

      this.isWaitingForSequence = true;
      const boxIndex = (row * this.matrix[0].length) + col;
      this.boxComponents.toArray()[boxIndex].showBuryAnimation();

      setTimeout(async () => {
        this.isBoardFlipped = false;

        setTimeout(async () => {
          const computerGuess = await this.controller.playHiderTurn(row, col);

          if (computerGuess) {
            this.animateComputerMove(computerGuess.row, computerGuess.col, computerGuess.found);
          }

          // Wait 3 seconds for computer's smash animation to finish, then show Next Round button
          setTimeout(() => {
            this.roundOver = true;
          }, 3000);

        }, 800);
      }, 1200);
    }
  }

  animateComputerMove(targetRow: number, targetCol: number, foundTreasure: boolean) {
    const targetBox = this.getBoxComponent(targetRow, targetCol);
    if (targetBox) {
      targetBox.animateComputerGuess(foundTreasure);
    }
  }

  async startVisualSimulation() {
    this.isSimulating = true;
    this.simRound = 0;
    this.simLog = [];

    const rows = this.matrix.length;
    const cols = this.matrix[0].length;

    for (let i = 1; i <= 100; i++) {
      if (!this.isSimulating) break;

      this.simRound = i;
      this.boxComponents.forEach((box) => box.resetBox());

      // 1. Get the moves from Flask
      const roundData = await this.controller.playSimulatedRound(rows, cols);
      if (!roundData) break;

      // 2. Animate Hider burying the treasure
      const hiderBox = this.getBoxComponent(roundData.hider_row, roundData.hider_col);
      if (hiderBox) hiderBox.showBuryAnimation();

      await this.delay(1200 / this.speedMultiplier);

      // 3. Animate Seeker smashing the box
      const seekerBox = this.getBoxComponent(roundData.seeker_row, roundData.seeker_col);
      if (seekerBox) seekerBox.animateComputerGuess(roundData.found_treasure);

      // 4. Update the Log and GLOBAL SCORES
      if (roundData.found_treasure) {
        this.simLog.unshift(
          `Round ${i}: Seeker caught the Hider at (${roundData.seeker_row}, ${roundData.seeker_col})!`,
        );
      } else {
        this.simLog.unshift(
          `Round ${i}: Hider survived! Bomb hit at (${roundData.seeker_row}, ${roundData.seeker_col}).`,
        );
      }

      // Calculate the exact decimal score delta from the Python backend!
      if (roundData.updated_scores) {
        const hiderDelta = roundData.updated_scores.hider - this.gameData.getCurrentScores().hider;
        const seekerDelta = roundData.updated_scores.seeker - this.gameData.getCurrentScores().seeker;

        if (hiderDelta !== 0) this.controller.updateScore('hider', hiderDelta);
        if (seekerDelta !== 0) this.controller.updateScore('seeker', seekerDelta);
      }

      // Keep log short so it doesn't overflow
      if (this.simLog.length > 5) this.simLog.pop();

      await this.delay(2500 / this.speedMultiplier);
    }

    this.simLog.unshift(`--- VOYAGE COMPLETE ---`);
    this.isSimulating = false;
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

  setMatrixValues(values: { value: number; hider: boolean }[][]) {
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values[i].length; j++) {
        this.matrix[i][j].value = values[i][j].value;
        this.matrix[i][j].hider = values[i][j].hider;
      }
    }
  }
}
