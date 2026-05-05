import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameData } from '../../services/game-data';
import { DecimalPipe } from '@angular/common';
import { LPProblem } from '../../models/LPProblem';

@Component({
  selector: 'app-simplex-tableau',
  imports: [DecimalPipe], // Import DecimalPipe to format probabilities
  templateUrl: './simplex-tableau.html',
  styleUrl: './simplex-tableau.css',
})
export class SimplexTableau {
  rows = 0;
  columns = 0;
  totalPlaces = 0;
  role: string | null = null;
  hiderScore = 0;
  seekerScore = 0;

  // Variables to hold the backend data
  hiderProbs: number[] = []; // x1, x2, x3...
  seekerProbs: number[] = []; // y1, y2, y3...
  payoffMatrix: number[][] = [];
  primalProblem: LPProblem | null = null;
  dualProblem: LPProblem | null = null;
  constructor(private router: Router, private gameData: GameData) {
    this.gameData.getSize().subscribe(size => {
      this.rows = size.rows;
      this.columns = size.columns;
      this.totalPlaces = this.rows * this.columns;

      // // Temporary: Generate mock data to build the UI
      // if (this.totalPlaces > 0) {
      //   this.generateMockTableauData();
      // }
    });

    this.gameData.getRole().subscribe(role => {
      this.role = role;
    });

    this.gameData.getScores().subscribe(scores => {
      this.hiderScore = scores.hider;
      this.seekerScore = scores.seeker;
    });
    const simplexData = this.gameData.getSimplexData();
    simplexData.matrix.subscribe(matrix => {
      if (matrix) this.payoffMatrix = matrix;
    });
    simplexData.dual.subscribe(dual =>{
      if (dual) this.dualProblem = dual;
    });
    simplexData.primal.subscribe(primal =>{
      if (primal) this.primalProblem = primal;
    });

    simplexData.hiderProbs.subscribe(hider =>{
      if (hider) this.hiderProbs = hider;
    });

    simplexData.seekerProbs.subscribe(sProbs => {
      if (sProbs) this.seekerProbs = sProbs;
    });
  }

  // // TODO: Replace this with actual HTTP call to Flask backend later
  // generateMockTableauData() {
  //   this.hiderProbs = Array(this.totalPlaces).fill(1 / this.totalPlaces);
  //   this.seekerProbs = Array(this.totalPlaces).fill(1 / this.totalPlaces);
  //
  //   this.payoffMatrix = [];
  //   for (let i = 0; i < this.totalPlaces; i++) {
  //     const row = [];
  //     for (let j = 0; j < this.totalPlaces; j++) {
  //       // Randomly simulate Hard (-3, 1), Neutral (-1, 1), or Easy (-1, 2) scores
  //       row.push(Math.floor(Math.random() * 5) - 2);
  //     }
  //     this.payoffMatrix.push(row);
  //   }
  //   this.primalProblem = {
  //     objective: 'Minimize Z = x1 + x2 + x3',
  //     constraints: [
  //       'Subject to:',
  //       '-1x1 + 2x2 + 1x3 >= 1',
  //       '1x1 - 1x2 + 1x3 >= 1',
  //       '1x1 + 2x2 - 3x3 >= 1',
  //       'x1, x2, x3 >= 0'
  //     ]
  //   };
  //   this.dualProblem = {
  //     objective: 'Maximize W = y1 + y2 + y3',
  //     constraints: [
  //       'Subject to:',
  //       '-1y1 + 1y2 + 1y3 <= 1',
  //       '2y1 - 1y2 + 2y3 <= 1',
  //       '1y1 + 1y2 - 3y3 <= 1',
  //       'y1, y2, y3 >= 0'
  //     ]
  //   };
  // }
  //
  closeSimplexTableau() {
    this.router.navigate(['/game-page']);
  }
}
