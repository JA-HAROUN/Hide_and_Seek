import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { GameData } from '../../services/game-data';

@Component({
  selector: 'app-get-map-size',
  imports: [],
  templateUrl: './get-map-size.html',
  styleUrl: './get-map-size.css',
})
export class GetMapSize {
  
  rows: number | null = null;
  columns: number | null = null;

  constructor(private router: Router, private gameData: GameData) {
    this.rows = null;
    this.columns = null;
  }

  generateMatrix() {
    this.gameData.setSize(this.rows || 0, this.columns || 0);
    this.router.navigate(['/game-page']);
  }
  changeRole() {
    // TODO: navigate to the role selection page
    this.router.navigate(['/choose-role']);
  }
}
