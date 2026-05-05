import numpy as np
from scipy.optimize import linprog
import random



def generate_matrix(n,m):
    list = []

    for x in range(n):
        for y in range(m):
            list.append(random.choice([1, 2, 3]))

    temp = np.array(list)

    matrix = temp.reshape(n,m)

    return matrix


def solve_matrix(m):
    rows, cols = len(m), len(m[0])

    pay_matrix=[]
    for x in range(rows):
        for y in range(cols):
            if y == x:
                if m[x][y] == 3:
                    pay_matrix.append(-3)
                else:
                    pay_matrix.append(-1)
            else:
                if m[x][y] == 3:
                    pay_matrix.append(1)
                elif m[x][y] == 2:
                    pay_matrix.append(2)
                else:
                    pay_matrix.append(1)

    matrix = np.array(pay_matrix).reshape(rows, cols)

    A = matrix
    m, n = A.shape

    c = [-1] + [0]*m

    # constraints
    A_ub = []
    b_ub = []

    for j in range(n):
        constraint = [1] + list(-A[:, j])
        A_ub.append(constraint)
        b_ub.append(0)

    A_eq = [[0] + [1]*m]
    b_eq = [1]

    bounds = [(None, None)] + [(0, 1)]*m

    res = linprog(c, A_ub, b_ub, A_eq, b_eq, bounds=bounds)


    return matrix,res.x[1:]


def generate_place_and_compute(x, y, rows, cols):
    x1 = random.randint(1, rows) - 1
    y1 = random.randint(1, cols) - 1
    distance = abs(x-x1) + abs(y-y1)
    if distance == 0:
        return #return the score and the seeker wins
    elif distance == 1:
        return #return the score multiplied by 0.5 and the hider wins
    elif distance == 2:
        return #return the score multiplied by 0.75 and the hider wins
    else:
        return #return the score multiplied by 1 and the hider wins




#def main (x,y,isHidder):
#m = generate_matrix(x,y)
#solve_matrix(m)
#send_results
#recive_data
#generate_place
#calculate validity
#compute score

def test_generate_matrix_shape():
    for n, m in [(2, 2), (3, 4), (1, 5), (5, 1)]:
        mat = generate_matrix(n, m)
        assert mat.shape == (n, m), f"Expected ({n},{m}), got {mat.shape}"
    print("PASS  test_generate_matrix_shape")


def test_generate_matrix_values():
    mat = generate_matrix(10, 10)
    unique = set(mat.flatten().tolist())
    assert unique.issubset({1, 2, 3}), f"Unexpected values: {unique}"
    print("PASS  test_generate_matrix_values")


def test_solve_matrix_strategy_sums_to_one():
    random.seed(0)
    mat = generate_matrix(3, 3)
    _, strategy = solve_matrix(mat)
    total = round(sum(strategy), 6)
    assert total == 1.0, f"Probabilities sum to {total}, expected 1.0"
    print("PASS  test_solve_matrix_strategy_sums_to_one")


def test_solve_matrix_probabilities_non_negative():
    random.seed(42)
    mat = generate_matrix(3, 3)
    _, strategy = solve_matrix(mat)
    assert all(p >= -1e-9 for p in strategy), f"Negative probability found: {strategy}"
    print("PASS  test_solve_matrix_probabilities_non_negative")


def test_solve_matrix_pay_matrix_shape():
    random.seed(7)
    mat = generate_matrix(4, 4)
    pay_matrix, _ = solve_matrix(mat)
    assert pay_matrix.shape == mat.shape, (
        f"Pay-matrix shape {pay_matrix.shape} != input shape {mat.shape}"
    )
    print("PASS  test_solve_matrix_pay_matrix_shape")


def test_solve_matrix_diagonal_values():
    """Diagonal cells must map to -3 (if original==3) or -1 (otherwise)."""
    random.seed(1)
    mat = generate_matrix(3, 3)
    pay_matrix, _ = solve_matrix(mat)
    for i in range(3):
        expected = -3 if mat[i][i] == 3 else -1
        assert pay_matrix[i][i] == expected, (
            f"Diagonal [{i},{i}]: expected {expected}, got {pay_matrix[i][i]}"
        )
    print("PASS  test_solve_matrix_diagonal_values")


def test_solve_matrix_non_square():
    """solve_matrix should work even for non-square matrices."""
    random.seed(99)
    mat = generate_matrix(2, 4)
    pay_matrix, strategy = solve_matrix(mat)
    assert pay_matrix.shape == (2, 4)
    assert abs(sum(strategy) - 1.0) < 1e-6
    print("PASS  test_solve_matrix_non_square")


# ── run all tests ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    test_generate_matrix_shape()
    test_generate_matrix_values()
    test_solve_matrix_strategy_sums_to_one()
    test_solve_matrix_probabilities_non_negative()
    test_solve_matrix_pay_matrix_shape()
    test_solve_matrix_diagonal_values()
    test_solve_matrix_non_square()
    print("\nAll tests passed ✓")


