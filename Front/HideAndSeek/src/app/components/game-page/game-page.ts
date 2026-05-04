import { Component } from '@angular/core';
import { MatrixGenerator } from "../matrix-generator/matrix-generator";
import { Router } from '@angular/router';
import { GameData } from '../../services/game-data';

@Component({
  selector: 'app-game-page',
  imports: [MatrixGenerator],
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
})
export class GamePage {
  hiderScore: number = 0;
  seekerScore: number = 0;
  gameRows: number = 0;
  gameColumns: number = 0;
  currentRole: string | null = null;

  constructor(private gameData: GameData, private router: Router) {
    this.hiderScore = 0;
    this.seekerScore = 0;
    this.gameRows = this.gameData.getCurrentSize().rows;
    this.gameColumns = this.gameData.getCurrentSize().columns;
    this.currentRole = this.gameData.getCurrentRole();
    this.gameData.getScores().subscribe(s => {
      this.hiderScore = s.hider;
      this.seekerScore = s.seeker;
    });
  }

  /*
    show the Simplex Tableau in a pop-up page
  */
  showSimplexTableau() {
    this.router.navigate(['/simplex-tableau']);
  }

  /*
    clear all game data and reset scores to 0
    and get back to the choose-role page
  */
  resetGame() {
    this.gameData.clear();
    this.router.navigate(['/choose-role']);
  }

}

