import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MapSize } from '../models/map-size';
import { GameBox } from '../models/game-box';

@Injectable({ providedIn: 'root' })
export class GameData {
  private size$ = new BehaviorSubject<MapSize>({ rows: 0, columns: 0 });
  private role$ = new BehaviorSubject<'hider' | 'third' | 'seeker' | null>(null);
  private scores$ = new BehaviorSubject<{ hider: number; seeker: number }>({ hider: 0, seeker: 0 });
  private matrix$ = new BehaviorSubject<GameBox[][]>([]);
  private wins$ = new BehaviorSubject<{ hider: number; seeker: number }>({ hider: 0, seeker: 0 });
  private payoffMatrix = new BehaviorSubject<number[][]>([]);
  private primalProblem = new BehaviorSubject<any>(null);
  private dualProblem = new BehaviorSubject<any>(null);
  private hiderProbs = new BehaviorSubject<number[]>([]);
  private seekerProbs = new BehaviorSubject<number[]>([]);
  private useProximity: boolean = true;
  // Size
  setSize(rows: number, columns: number) {
    this.size$.next({ rows: rows || 0, columns: columns || 0 });
    this.generateEmptyMatrix(rows || 0, columns || 0);
  }

  getSize() {
    return this.size$.asObservable();
  }

  getCurrentSize() {
    return this.size$.value;
  }

  // Role
  setRole(role: 'hider' | 'third' | 'seeker' | null) {
    this.role$.next(role);
  }

  getRole() {
    return this.role$.asObservable();
  }

  getCurrentRole() {
    return this.role$.value;
  }

  // Scores
  setScores(hider: number, seeker: number) {
    this.scores$.next({ hider, seeker });
  }

  updateScore(who: 'hider' | 'seeker', delta: number) {
    const cur = this.scores$.value;
    const updated = { ...cur, [who]: cur[who] + delta } as { hider: number; seeker: number };
    this.scores$.next(updated);
  }

  getScores() {
    return this.scores$.asObservable();
  }

  getCurrentScores() {
    return this.scores$.value;
  }

  // Matrix
  setMatrix(matrix: GameBox[][]) {
    this.matrix$.next(matrix);
  }

  getMatrix() {
    return this.matrix$.asObservable();
  }

  getCurrentMatrix() {
    return this.matrix$.value;
  }

  // Reset all game state to initial defaults
  clear() {
    this.size$.next({ rows: 0, columns: 0 });
    this.role$.next(null);
    this.scores$.next({ hider: 0, seeker: 0 });
    this.wins$.next({ hider: 0, seeker: 0 });
    this.matrix$.next([]);

  }

  // Helpers
  private generateEmptyMatrix(rows: number, columns: number) {
    const matrix: GameBox[][] = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < columns; j++) {
        matrix[i][j] = { value: null, hider: null, revealed: false };
      }
    }
    this.matrix$.next(matrix);
  }

  setSimplexData(matrix: number[][], primal: any, dual: any, hProbs: number[], sProbs: number[]) {
    this.payoffMatrix.next(matrix);
    this.primalProblem.next(primal);
    this.dualProblem.next(dual);
    this.hiderProbs.next(hProbs);
    this.seekerProbs.next(sProbs);
  }

  getSimplexData() {
    return {
      matrix: this.payoffMatrix.asObservable(),
      primal: this.primalProblem.asObservable(),
      dual: this.dualProblem.asObservable(),
      hiderProbs: this.hiderProbs.asObservable(),
      seekerProbs: this.seekerProbs.asObservable(),
    };
  }
  setUseProximity(val: boolean) {
    this.useProximity = val;
  }

  getUseProximity(): boolean {
    return this.useProximity;
  }
  updateWins(who: 'hider' | 'seeker', delta: number) {
    const cur = this.wins$.value;
    const updated = { ...cur, [who]: cur[who] + delta } as { hider: number; seeker: number };
    this.wins$.next(updated);
  }

  getWins() {
    return this.wins$.asObservable();
  }

  getCurrentWins() {
    return this.wins$.value;
  }
}
