import numpy as np
from scipy.optimize import linprog
import random
from enum import Enum

class Player(Enum):
    SEEKER = 1
    HIDER = 2
    THIRD = 3

class Game:
    def __init__(self, rows, cols):
        self.rows = rows
        self.cols = cols
        self.matrix = None
        self.pay_matrix = None
        self.probabilities = None # Hider's optimal strategy
        self.value = 0
        self.hider_position = None

        self.hider_score = 0
        self.seeker_score = 0

        self.generate_matrix()
        self.solve_matrix()

    def generate_matrix(self):
        list_vals = []
        for _ in range(self.rows):
            for _ in range(self.cols):
                list_vals.append(random.choice([1, 2, 3]))

        temp = np.array(list_vals)
        self.matrix = temp.reshape(self.rows, self.cols)

    def solve_matrix(self):
        m_flat = self.matrix.flatten()
        num_cells = self.rows * self.cols

        pay_matrix=[]
        for x in range(num_cells):  # Seeker chooses a cell
            for y in range(num_cells):  # Hider chooses a cell
                if y == x:
                    if m_flat[x] == 3:
                        pay_matrix.append(-3)
                    else:
                        pay_matrix.append(-1)
                else:
                    if m_flat[y] == 3:
                        pay_matrix.append(1)
                    elif m_flat[y] == 2:
                        pay_matrix.append(2)
                    else:
                        pay_matrix.append(1)

        self.pay_matrix = np.array(pay_matrix).reshape(num_cells, num_cells)

        A = self.pay_matrix
        m_rows, n_cols = A.shape
        c = [-1] + [0]*m_rows

        A_ub = []
        b_ub = []
        for j in range(n_cols):
            constraint = [1] + list(-A[:, j])
            A_ub.append(constraint)
            b_ub.append(0)

        A_eq = [[0] + [1]*m_rows]
        b_eq = [1]
        bounds = [(None, None)] + [(0, 1)]*m_rows

        res = linprog(c, A_ub, b_ub, A_eq, b_eq, bounds=bounds)

        # Save the probabilities so the computer can use them to guess!
        if res.success:
            self.value = res.x[0]
            self.probabilities = res.x[1:]
        else:
            self.value = 0
            self.probabilities = np.ones(num_cells) / num_cells

        return self.matrix, self.probabilities

    def set_hider_position(self, row, col):
        self.hider_position = (row, col)

    def get_computer_choice(self):
        """Lets the computer pick a box based on the Simplex probabilities"""
        num_cells = self.rows * self.cols
        probs = np.maximum(self.probabilities, 0)
        if probs.sum() == 0:
            probs = np.ones(num_cells) / num_cells
        else:
            probs = probs / probs.sum()

        choice = np.random.choice(num_cells, p=probs)
        return int(choice // self.cols), int(choice % self.cols)

    def generate_place_and_compute(self, seeker_row, seeker_col):
        """Calculates proximity rules and updates the scores"""
        h_row, h_col = self.hider_position
        distance = abs(seeker_row - h_row) + abs(seeker_col - h_col)

        base_score = float(self.matrix[seeker_row][seeker_col])
        found = False

        if distance == 0:
            # Seeker found the hider!
            found = True
            score_delta = base_score * 1
            self.seeker_score += score_delta
            self.hider_score -= score_delta
        elif distance == 1:
            # Hider safe, but very close (penalty applied)
            score_delta = base_score * 0.5
            self.hider_score += score_delta
            self.seeker_score -= score_delta
        elif distance == 2:
            # Hider safe, somewhat close (penalty applied)
            score_delta = base_score * 0.75
            self.hider_score += score_delta
            self.seeker_score -= score_delta
        else:
            # Hider perfectly safe (full score)
            score_delta = base_score * 1
            self.hider_score += score_delta
            self.seeker_score -= score_delta

        return {
            "distance": distance,
            "found": found,
            "score_delta": score_delta
        }