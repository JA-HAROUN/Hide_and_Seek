import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameData } from '../../services/game-data';
import { FormsModule } from '@angular/forms'; // 1. CRITICAL: Needed for checkboxes!

@Component({
  selector: 'app-get-map-size',
  standalone: true,
  imports: [FormsModule], // 2. Add it here!
  templateUrl: './get-map-size.html',
  styleUrl: './get-map-size.css',
})
export class GetMapSize {
  rows: number | null = null;
  columns: number | null = null;
  useProximity: boolean = true;

  constructor(private router: Router, private gameData: GameData) {}

  generateMatrix() {
    // Save the rows and columns
    this.gameData.setSize(this.rows || 0, this.columns || 0);

    // 3. Save the proximity choice to your service before sailing!
    this.gameData.setUseProximity(this.useProximity);

    this.router.navigate(['/game-page']);
  }

  changeRole() {

    this.gameData.setSize(this.rows || 0, this.columns || 0);
    this.gameData.setUseProximity(this.useProximity);
    this.router.navigate(['/choose-role']);
  }
}
