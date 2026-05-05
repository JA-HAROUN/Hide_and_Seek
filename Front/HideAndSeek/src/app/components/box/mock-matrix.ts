// Mock matrix values for testing the box component
export const MOCK_MATRIX_VALUES: { value: number, hider: boolean }[][] = [
  [ { value: 1, hider: false }, { value: 2, hider: true },  { value: 3, hider: false } ],
  [ { value: 4, hider: false }, { value: 5, hider: false }, { value: 6, hider: true } ],
  [ { value: 7, hider: false }, { value: 8, hider: false }, { value: 9, hider: false } ]
];

export function generateMockMatrix(rows: number, cols: number): { value: number, hider: boolean }[][] {
  const matrix: { value: number, hider: boolean }[][] = [];
  const totalCells = rows * cols;
  const numHiders = Math.min(3, Math.max(2, Math.floor(totalCells / 10))); // Adjust num hiders based on size or fix to 2-3

  let valueCounter = 1;
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push({ value: valueCounter++, hider: false });
    }
    matrix.push(row);
  }

  // Randomly place 2-3 hiders distributed evenly
  const hiderCount = totalCells >= 6 ? Math.floor(Math.random() * 2) + 2 : (totalCells > 0 ? 1 : 0); // 2 or 3 hiders if possible

  if (hiderCount > 0) {
    const segments = Math.floor(totalCells / hiderCount);
    for (let k = 0; k < hiderCount; k++) {
      const start = k * segments;
      const end = k === hiderCount - 1 ? totalCells : (k + 1) * segments;
      const randomCell = Math.floor(Math.random() * (end - start)) + start;

      const r = Math.floor(randomCell / cols);
      const c = randomCell % cols;
      if (matrix[r] && matrix[r][c]) {
        matrix[r][c].hider = true;
      }
    }
  }

  return matrix;
}
