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

  getSnapshot(): GameSnapshot {
    return {
      size: this.gameData.getCurrentSize(),
      role: this.gameData.getCurrentRole(),
      scores: this.gameData.getCurrentScores(),
      matrix: this.gameData.getCurrentMatrix(),
    };
  }

  // --- 1. GAME SETUP ---
  async startGame(rows: number, columns: number, role: string, useProximity:boolean) {
    console.log(`🚀 [API POST] /setup-game | Payload:`, { rows, columns, role, use_proximity: useProximity });

    try {
      const response = await fetch('http://localhost:5000/api/setup-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, columns, role, use_proximity: useProximity })
      });

      const backendData = await response.json();
      console.log(`📥 [API RESPONSE] /setup-game | Data:`, backendData);

      this.gameData.setSimplexData(
        backendData.payoff_matrix,
        backendData.primal,
        backendData.dual,
        backendData.hider_probs,
        backendData.seeker_probs
      );

      return backendData.grid_layout;

    } catch (error) {
      console.error("❌ Failed to connect to backend Ahoy!", error);
      return null;
    }
  }

  // --- 2. SEEKER MODE FLOW ---
  async revealBox(row: number, column: number) {
    const matrix = this.gameData.getCurrentMatrix();
    if (!matrix[row] || !matrix[row][column]) return null;

    const nextMatrix = matrix.map((matrixRow) =>
      matrixRow.map((box) => ({ ...box })),
    );

    nextMatrix[row][column].revealed = true;
    this.gameData.setMatrix(nextMatrix);

    const snapshot = this.getSnapshot();
    const payload = {
      ...snapshot,
      clicked_row: row,
      clicked_col: column
    };

    console.log(`🚀 [API POST] /game-state (Seeker Move) | Payload:`, { clicked_row: row, clicked_col: column });
    await this.sendDataToBack(payload);
    return nextMatrix[row][column];
  }

  async sendDataToBack(payload: any) {
    try {
      const response = await fetch('http://localhost:5000/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Failed to send game state: ${response.status}`);

      const responseData = await response.json();
      console.log(`📥 [API RESPONSE] /game-state | Data:`, responseData);

      if (responseData.updated_scores) {
        const hiderDelta = responseData.updated_scores.hider - this.gameData.getCurrentScores().hider;
        const seekerDelta = responseData.updated_scores.seeker - this.gameData.getCurrentScores().seeker;

        if (hiderDelta !== 0) this.updateScore('hider', hiderDelta);
        if (seekerDelta !== 0) this.updateScore('seeker', seekerDelta);
      }
      return responseData;
    } catch (error) {
      console.error("❌ Error communicating with backend:", error);
    }
  }

  // --- 3. HIDER MODE FLOW ---
  async playHiderTurn(hiddenRow: number, hiddenCol: number) {
    const payload = {
      hidden_row: hiddenRow,
      hidden_col: hiddenCol,
      ...this.getSnapshot()
    };

    console.log(`🚀 [API POST] /computer-guess (Hider Mode) | Payload:`, { hidden_row: hiddenRow, hidden_col: hiddenCol });

    try {
      const response = await fetch('http://localhost:5000/api/computer-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log(`📥 [API RESPONSE] /computer-guess | Data:`, data);

      if (data.updated_scores) {
        const hiderDelta = data.updated_scores.hider - this.gameData.getCurrentScores().hider;
        const seekerDelta = data.updated_scores.seeker - this.gameData.getCurrentScores().seeker;

        if (hiderDelta !== 0) this.updateScore('hider', hiderDelta);
        if (seekerDelta !== 0) this.updateScore('seeker', seekerDelta);
      }

      return {
        row: data.computer_guess_row,
        col: data.computer_guess_col,
        found: data.found_treasure
      };
    } catch (error) {
      console.error("❌ Backend connection failed", error);
      return null;
    }
  }

  // --- 4. QUARTERMASTER / SIMULATION FLOW ---
  async playSimulatedRound(rows: number, columns: number) {
    console.log(`🚀 [API POST] /simulate-round | Requesting 1 auto-battle round...`);
    try {
      const response = await fetch('http://localhost:5000/api/simulate-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, columns })
      });

      const data = await response.json();
      console.log(`📥 [API RESPONSE] /simulate-round | Data:`, data);
      return data;
    } catch (error) {
      console.error("❌ Simulation round failed!", error);
      return null;
    }
  }

  async runSimulation(rows: number, columns: number) {
    try {
      const response = await fetch('http://localhost:5000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, columns, rounds: 100 })
      });
      return await response.json();
    } catch (error) {
      console.error("❌ Simulation failed!", error);
      return null;
    }
  }

  async nextRound(role: string) {
    console.log(`🚀 [API POST] /next-round | Role:`, role);
    try {
      const response = await fetch('http://localhost:5000/api/next-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      const data = await response.json();
      console.log(`📥 [API RESPONSE] /next-round | Data:`, data);
      return data.grid_layout;
    } catch (error) {
      console.error("❌ Failed to fetch next round", error);
      return null;
    }
  }
}
