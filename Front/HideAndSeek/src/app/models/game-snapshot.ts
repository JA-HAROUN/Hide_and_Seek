import { GameBox } from './game-box';

export interface GameSnapshot {
	size: { rows: number; columns: number };
	role: 'hider' | 'third' | 'seeker' | null;
	scores: { hider: number; seeker: number };
	matrix: GameBox[][];
}
