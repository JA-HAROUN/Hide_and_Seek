import { Injectable } from '@angular/core';
import { GameData } from './game-data';
import { GameSnapshot } from '../models/game-snapshot';

@Injectable({
  providedIn: 'root',
})
export class Controller {
  constructor(private gameData: GameData) {}

  updateScore(who: 'hider' | 'seeker', delta: number) {
    this.gameData.updateScore(who, delta);
  }

  async startGame(rows: number, columns: number, role: string) {
    try {
      // 1. Tell Flask to build the board and do the math
      const response = await fetch('http://localhost:5000/api/setup-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, columns, role })
      });

      const backendData = await response.json();

      // 2. Save the math to GameData for the Tableau
      this.gameData.setSimplexData(
        backendData.payoff_matrix,
        backendData.primal,
        backendData.dual,
        backendData.hider_probs,
        backendData.seeker_probs
      );

      // 3. Return the actual box grid (where the hider is) to draw the map
      return backendData.grid_layout; // Array of {value, hider: true/false}

    } catch (error) {
      console.error("Failed to connect to backend Ahoy!", error);
      return null;
    }
  }

  // Changed to async to handle the backend call immediately upon revealing
  async revealBox(row: number, column: number) {
    const matrix = this.gameData.getCurrentMatrix();
    if (!matrix[row] || !matrix[row][column]) {
      return null;
    }

    const nextMatrix = matrix.map((matrixRow) =>
      matrixRow.map((box) => ({ ...box })),
    );

    nextMatrix[row][column].revealed = true;
    this.gameData.setMatrix(nextMatrix);

    // Create the snapshot and append the specific move made
    const snapshot = this.getSnapshot();
    const payload = {
      ...snapshot,
      clicked_row: row,
      clicked_col: column
    };

    // Send the move to Flask and await the updated scores
    await this.sendDataToBack(payload);

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

  // Updated to point to the correct URL and handle the incoming JSON response
  async sendDataToBack(payload: any) {
    try {

      const response = await fetch('http://localhost:5000/api/game-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send game state: ${response.status}`);
      }

      const responseData = await response.json();

      // Update the Angular frontend with the new scores calculated by Flask
      if (responseData.updated_scores) {
        const hiderDelta = responseData.updated_scores.hider - this.gameData.getCurrentScores().hider;
        const seekerDelta = responseData.updated_scores.seeker - this.gameData.getCurrentScores().seeker;

        if (hiderDelta !== 0) this.updateScore('hider', hiderDelta);
        if (seekerDelta !== 0) this.updateScore('seeker', seekerDelta);
      }

      return responseData;
    } catch (error) {
      console.error("Error communicating with backend:", error);
    }
  }

  async playHiderTurn(hiddenRow: number, hiddenCol: number) {
    const payload = {
      hidden_row: hiddenRow,
      hidden_col: hiddenCol,
      ...this.getSnapshot()
    };

    try {
      const response = await fetch('http://localhost:5000/api/computer-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Update scores
      if (data.updated_scores) {
        // update logic...
      }

      // Return the computer's guess coordinates so the UI can animate them
      return {
        row: data.computer_guess_row,
        col: data.computer_guess_col,
        found: data.found_treasure
      };
    } catch (error) {
      console.error("Backend connection failed", error);
      return null;
    }
  }
}
