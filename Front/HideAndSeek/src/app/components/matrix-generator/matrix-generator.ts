import { Component, OnDestroy, QueryList, ViewChildren, NgZone } from '@angular/core';
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

  isSimulating: boolean = false;
  speedMultiplier: number = 1;
  simRound: number = 0;
  simLog: string[] = [];

  roundOver: boolean = false;

  private delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  @ViewChildren(Box) boxComponents!: QueryList<Box>;

  constructor(
    private gameData: GameData,
    private controller: Controller,
    private zone: NgZone // <--- The ultimate fix to wake up the whole app!
  ) {
    this.matrix = [];

    this.sub = this.gameData.getSize().subscribe(async (s: MapSize) => {
      if (s.rows > 0 && s.columns > 0) {
        this.generateMatrix(s.rows, s.columns);
        this.currentRole = this.gameData.getCurrentRole() || 'seeker';

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
      this.isWaitingForSequence = true;
      await this.controller.revealBox(row, col);

      const isHit = this.matrix[row][col].hider;

      if (isHit) {
        // Direct Hit!
        setTimeout(() => {
          this.zone.run(() => { // <--- Forces Angular to update scores AND buttons!
            this.roundOver = true;
          });
        }, 2500);
      } else {
        // Missed!
        setTimeout(() => {
          let treasureRow = -1;
          let treasureCol = -1;

          for (let r = 0; r < this.matrix.length; r++) {
            for (let c = 0; c < this.matrix[r].length; c++) {
              if (this.matrix[r][c].hider) {
                treasureRow = r;
                treasureCol = c;
                break;
              }
            }
          }

          if (treasureRow !== -1 && treasureCol !== -1) {
            const treasureBox = this.getBoxComponent(treasureRow, treasureCol);
            if (treasureBox) {
              treasureBox.animateComputerGuess(true);
            }
          }

          setTimeout(() => {
            this.zone.run(() => { // <--- Forces Angular to update scores AND buttons!
              this.roundOver = true;
            });
          }, 2500);

        }, 1500);
      }
    }
    else if (this.currentRole === 'hider') {
      if (!this.isBoardFlipped) return;

      this.isWaitingForSequence = true;
      const boxIndex = (row * this.matrix[0].length) + col;
      this.boxComponents.toArray()[boxIndex].showBuryAnimation();

      setTimeout(async () => {
        this.zone.run(() => {
          this.isBoardFlipped = false;
        });

        setTimeout(async () => {
          const computerGuess = await this.controller.playHiderTurn(row, col);

          if (computerGuess) {
            this.animateComputerMove(computerGuess.row, computerGuess.col, computerGuess.found);
          }

          setTimeout(() => {
            this.zone.run(() => { // <--- Previously missing! Forces the app update.
              this.roundOver = true;
            });
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

      const roundData = await this.controller.playSimulatedRound(rows, cols);
      if (!roundData) break;

      const hiderBox = this.getBoxComponent(roundData.hider_row, roundData.hider_col);
      if (hiderBox) hiderBox.showBuryAnimation();

      await this.delay(1200 / this.speedMultiplier);

      const seekerBox = this.getBoxComponent(roundData.seeker_row, roundData.seeker_col);
      if (seekerBox) seekerBox.animateComputerGuess(roundData.found_treasure);

      if (roundData.found_treasure) {
        this.simLog.unshift(
          `Round ${i}: Seeker caught the Hider at (${roundData.seeker_row}, ${roundData.seeker_col})!`,
        );
        this.zone.run(() => {
          this.controller.updateWins('seeker', 1);
        });
      } else {
        this.simLog.unshift(
          `Round ${i}: Hider survived! Bomb hit at (${roundData.seeker_row}, ${roundData.seeker_col}).`,
        );
        this.zone.run(() => {
          this.controller.updateWins('hider', 1); // <--- FIXED: This was accidentally 'seeker' before!
        });
      }

      if (roundData.updated_scores) {
        const hiderDelta = roundData.updated_scores.hider - this.gameData.getCurrentScores().hider;
        const seekerDelta = roundData.updated_scores.seeker - this.gameData.getCurrentScores().seeker;

        this.zone.run(() => {
          if (hiderDelta !== 0) this.controller.updateScore('hider', hiderDelta);
          if (seekerDelta !== 0) this.controller.updateScore('seeker', seekerDelta);
        });
      }

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
