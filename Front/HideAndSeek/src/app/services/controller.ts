import { Injectable } from '@angular/core';
import { GameData } from './game-data';
import { GameBox } from '../models/game-box';
import { GameSnapshot } from '../models/game-snapshot';

@Injectable({
  providedIn: 'root',
})
export class Controller {
  constructor(private gameData: GameData) {}

  updateScore(who: 'hider' | 'seeker', delta: number) {
    this.gameData.updateScore(who, delta);
  }

  revealBox(row: number, column: number) {
    const matrix = this.gameData.getCurrentMatrix();
    if (!matrix[row] || !matrix[row][column]) {
      return null;
    }

    const nextMatrix = matrix.map((matrixRow) =>
      matrixRow.map((box) => ({ ...box })),
    );

    nextMatrix[row][column].revealed = true;
    this.gameData.setMatrix(nextMatrix);
    return nextMatrix[row][column];
  }

  getSnapshot(): GameSnapshot {
    return {
      size: this.gameData.getCurrentSize(),
      role: this.gameData.getCurrentRole(),
      scores: this.gameData.getCurrentScores(),
      matrix: this.gameData.getCurrentMatrix(),
    };
  }

  async sendDataToBack(snapshot: GameSnapshot = this.getSnapshot()) {
    const response = await fetch('/api/game-state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapshot),
    });

    if (!response.ok) {
      throw new Error(`Failed to send game state: ${response.status}`);
    }

    return response;
  }
}
