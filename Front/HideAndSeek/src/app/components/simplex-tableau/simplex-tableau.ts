import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameData } from '../../services/game-data';
import { DecimalPipe } from '@angular/common';
import { LPProblem } from '../../models/LPProblem';

@Component({
  selector: 'app-simplex-tableau',
  imports: [DecimalPipe],
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

  hiderProbs: number[] = [];
  seekerProbs: number[] = [];
  payoffMatrix: number[][] = [];

  // These will hold our generated algebra!
  primalProblem: LPProblem | null = null;
  dualProblem: LPProblem | null = null;

  constructor(private router: Router, private gameData: GameData) {
    this.gameData.getSize().subscribe(size => {
      this.rows = size.rows;
      this.columns = size.columns;
      this.totalPlaces = this.rows * this.columns;
    });

    this.gameData.getRole().subscribe(role => {
      this.role = role;
    });

    this.gameData.getScores().subscribe(scores => {
      this.hiderScore = scores.hider;
      this.seekerScore = scores.seeker;
    });

    const simplexData = this.gameData.getSimplexData();

    // 1. Get the Probabilities
    simplexData.hiderProbs.subscribe(hider => {
      if (hider) this.hiderProbs = hider;
    });

    simplexData.seekerProbs.subscribe(sProbs => {
      if (sProbs) this.seekerProbs = sProbs;
    });

    // 2. Get the Matrix, and IMMEDIATELY generate the math equations!
    simplexData.matrix.subscribe(matrix => {
      if (matrix && matrix.length > 0) {
        this.payoffMatrix = matrix;
        this.generateLPFormulations(); // <-- This is the magic step!
      }
    });
  }

  // This function reads the matrix numbers and turns them into algebra strings
  generateLPFormulations() {
    const rows = this.payoffMatrix.length;
    const cols = this.payoffMatrix[0].length;

    // --- Build Primal Problem (Hider) ---
    const primalConstraints = [];
    for (let j = 0; j < cols; j++) {
      let eq: string[] = [];
      for (let i = 0; i < rows; i++) {
        const val = this.payoffMatrix[i][j];
        if (val !== 0) {
          if (eq.length === 0) {
            eq.push(`${val}x${i + 1}`);
          } else {
            eq.push(val > 0 ? `+ ${val}x${i + 1}` : `- ${Math.abs(val)}x${i + 1}`);
          }
        }
      }
      primalConstraints.push(`${eq.join(' ')} ≥ V`);
    }
    primalConstraints.push(`x1 + ... + x${rows} = 1`);
    primalConstraints.push(`xi ≥ 0`);

    this.primalProblem = {
      objective: 'Maximize: V (Value of the Game)',
      constraints: primalConstraints
    };

    // --- Build Dual Problem (Seeker) ---
    const dualConstraints = [];
    for (let i = 0; i < rows; i++) {
      let eq: string[] = [];
      for (let j = 0; j < cols; j++) {
        const val = this.payoffMatrix[i][j];
        if (val !== 0) {
          if (eq.length === 0) {
            eq.push(`${val}y${j + 1}`);
          } else {
            eq.push(val > 0 ? `+ ${val}y${j + 1}` : `- ${Math.abs(val)}y${j + 1}`);
          }
        }
      }
      dualConstraints.push(`${eq.join(' ')} ≤ V`);
    }
    dualConstraints.push(`y1 + ... + y${cols} = 1`);
    dualConstraints.push(`yj ≥ 0`);

    this.dualProblem = {
      objective: 'Minimize: V (Value of the Game)',
      constraints: dualConstraints
    };
  }

  closeSimplexTableau() {
    this.router.navigate(['/game-page']);
  }
}
