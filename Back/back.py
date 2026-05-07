import numpy as np
from scipy.optimize import linprog
import random
from enum import Enum

class Player(Enum):
    SEEKER = 1
    HIDER = 2
    THIRD = 3

class Game:
    def __init__(self, rows, cols, use_proximity=True):
        self.rows = rows
        self.cols = cols
        self.matrix = None
        self.pay_matrix = None
        self.probabilities = None # Hider's optimal strategy
        self.seeker_probabilities = None # NEW: Seeker's optimal strategy (y)
        self.value = 0
        self.hider_position = None
        self.use_proximity = use_proximity
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

        pay_matrix = []
        for x in range(num_cells):
            for y in range(num_cells):
                seeker_row, seeker_col = divmod(x, self.cols)
                hider_row, hider_col = divmod(y, self.cols)
                distance = abs(seeker_row - hider_row) + abs(seeker_col - hider_col)
                base_score = float(m_flat[x])

                if distance == 0:
                    payoff = -base_score
                else:
                    if self.use_proximity:
                        if distance == 1: payoff = base_score * 0.5
                        elif distance == 2: payoff = base_score * 0.75
                        else: payoff = base_score * 1.0
                    else:
                        payoff = base_score * 1.0

                pay_matrix.append(payoff)

        self.pay_matrix = np.array(pay_matrix).reshape(num_cells, num_cells)
        A = self.pay_matrix
        m_rows, n_cols = A.shape

        # ==========================================
        # 1. PRIMAL PROBLEM (Hider's Strategy - x)
        # ==========================================
        c_primal = [-1] + [0] * m_rows
        A_ub_primal = []
        b_ub_primal = [0] * n_cols
        for j in range(n_cols):
            constraint = [1] + list(-A[:, j])
            A_ub_primal.append(constraint)

        A_eq_primal = [[0] + [1] * m_rows]
        b_eq_primal = [1]
        bounds_primal = [(None, None)] + [(0, 1)] * m_rows

        res_primal = linprog(c_primal, A_ub_primal, b_ub_primal, A_eq_primal, b_eq_primal, bounds=bounds_primal)

        if res_primal.success:
            self.value = res_primal.x[0]
            self.probabilities = res_primal.x[1:]
        else:
            self.value = 0
            self.probabilities = np.ones(num_cells) / num_cells

        # ==========================================
        # 2. DUAL PROBLEM (Seeker's Strategy - y)
        # ==========================================
        c_dual = [1] + [0] * n_cols
        A_ub_dual = []
        b_ub_dual = [0] * m_rows
        for i in range(m_rows):
            # Seeker constraint: sum(A_ij * y_j) <= V  --->  -V + sum(A_ij * y_j) <= 0
            constraint = [-1] + list(A[i, :])
            A_ub_dual.append(constraint)

        A_eq_dual = [[0] + [1] * n_cols]
        b_eq_dual = [1]
        bounds_dual = [(None, None)] + [(0, 1)] * n_cols

        res_dual = linprog(c_dual, A_ub_dual, b_ub_dual, A_eq_dual, b_eq_dual, bounds=bounds_dual)

        if res_dual.success:
            self.seeker_probabilities = res_dual.x[1:]
        else:
            self.seeker_probabilities = np.ones(num_cells) / num_cells

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
        h_row, h_col = self.hider_position
        distance = abs(seeker_row - h_row) + abs(seeker_col - h_col)

        base_score = float(self.matrix[seeker_row][seeker_col])
        found = False

        if distance == 0:
            # Direct Hit
            found = True
            score_delta = base_score * 1
            self.seeker_score += score_delta
            self.hider_score -= score_delta
        else:
            # Missed!
            if self.use_proximity:
                if distance == 1:
                    score_delta = base_score * 0.5
                elif distance == 2:
                    score_delta = base_score * 0.75
                else:
                    score_delta = base_score * 1
            else:
                score_delta = base_score * 1

            self.hider_score += score_delta
            self.seeker_score -= score_delta

        return {
            "distance": distance,
            "found": found,
            "score_delta": score_delta
        }