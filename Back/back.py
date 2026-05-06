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
        for x in range(num_cells):  # Seeker chooses a cell
            for y in range(num_cells):  # Hider chooses a cell

                # Convert 1D index to 2D row/col coordinates
                seeker_row, seeker_col = divmod(x, self.cols)
                hider_row, hider_col = divmod(y, self.cols)

                # Calculate the exact distance between the Seeker's guess and Hider's spot
                distance = abs(seeker_row - hider_row) + abs(seeker_col - hider_col)

                # Base score is based on the Seeker's chosen cell
                base_score = float(m_flat[x])

                if distance == 0:
                    # Direct Hit: Hider loses points
                    payoff = -base_score
                else:
                    # Miss: Hider gains points! (Apply proximity rules if enabled)
                    if self.use_proximity:
                        if distance == 1:
                            payoff = base_score * 0.5
                        elif distance == 2:
                            payoff = base_score * 0.75
                        else:
                            payoff = base_score * 1.0
                    else:
                        # If proximity is off, any miss is a full win for the Hider
                        payoff = base_score * 1.0

                pay_matrix.append(payoff)

        # Reshape into a 2D matrix for the Simplex solver
        self.pay_matrix = np.array(pay_matrix).reshape(num_cells, num_cells)

        A = self.pay_matrix
        m_rows, n_cols = A.shape

        # c represents the objective function (Minimize V)
        c = [-1] + [0] * m_rows

        A_ub = []
        b_ub = []
        for j in range(n_cols):
            constraint = [1] + list(-A[:, j])
            A_ub.append(constraint)
            b_ub.append(0)

        A_eq = [[0] + [1] * m_rows]
        b_eq = [1]
        bounds = [(None, None)] + [(0, 1)] * m_rows

        # Solve the Linear Programming Problem!
        res = linprog(c, A_ub, b_ub, A_eq, b_eq, bounds=bounds)

        # Save the probabilities so the computer can use them to guess
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