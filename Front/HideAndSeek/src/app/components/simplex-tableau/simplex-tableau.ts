import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameData } from '../../services/game-data';

@Component({
  selector: 'app-simplex-tableau',
  imports: [],
  templateUrl: './simplex-tableau.html',
  styleUrl: './simplex-tableau.css',
})
export class SimplexTableau {
  rows = 0;
  columns = 0;
  role: string | null = null;
  hiderScore = 0;
  seekerScore = 0;

  constructor(private router: Router, private gameData: GameData) {
    this.gameData.getSize().subscribe(size => {
      this.rows = size.rows;
      this.columns = size.columns;
    });

    this.gameData.getRole().subscribe(role => {
      this.role = role;
    });

    this.gameData.getScores().subscribe(scores => {
      this.hiderScore = scores.hider;
      this.seekerScore = scores.seeker;
    });
  }


  /*
    close the Simplex Tableau pop-up page
    and get back to the game-page
  */
  closeSimplexTableau() {
    this.router.navigate(['/game-page']);
  }

}
