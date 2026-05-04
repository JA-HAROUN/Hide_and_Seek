import { Component } from '@angular/core';
import { MatrixGenerator } from '../components/matrix-generator/matrix-generator';

@Component({
  selector: 'app-game-page',
  imports: [MatrixGenerator],
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
})
export class GamePage {
  hiderScore: number = 0;
  seekerScore: number = 0;

  constructor() {
    this.hiderScore = 0;
    this.seekerScore = 0;
  }

}

