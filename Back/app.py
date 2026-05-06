from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import numpy as np
from back import Game

app = Flask(__name__)
CORS(app)

current_game = None

@app.route('/api/setup-game', methods=['POST'])
def setup_game():
    global current_game
    try:
        data = request.json
        rows = data.get('rows', 3)
        columns = data.get('columns', 3)
        role = data.get('role', 'seeker')

        print(f"\n🎮 Starting new game: {rows}x{columns}, Player role: {role}")
        current_game = Game(rows, columns)

        hider_row = random.randint(0, rows - 1)
        hider_col = random.randint(0, columns - 1)
        current_game.set_hider_position(hider_row, hider_col)

        grid_layout = []
        for row in range(rows):
            current_row = []
            for col in range(columns):
                is_hider = (row == hider_row and col == hider_col)
                current_row.append({
                    "row": row,
                    "col": col,
                    "value": int(current_game.matrix[row][col]),
                    "revealed": False,
                    "hider": is_hider
                })
            grid_layout.append(current_row)

        hider_probs = current_game.probabilities.tolist()

        response = {
            "success": True,
            "rows": rows,
            "columns": columns,
            "payoff_matrix": current_game.pay_matrix.tolist(),
            "primal": hider_probs,
            "dual": hider_probs,
            "hider_probs": hider_probs,
            "seeker_probs": hider_probs,
            "grid_layout": grid_layout,
            "game_value": float(current_game.value)
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/next-round', methods=['POST'])
def next_round():
    """Starts a new round on the same matrix."""
    global current_game
    if current_game is None:
        return jsonify({"error": "No active game"}), 400

    try:
        data = request.json
        role = data.get('role', 'seeker')

        # If the user is the Seeker, the computer needs to pick a new hiding spot!
        if role == 'seeker':
            hider_row = random.randint(0, current_game.rows - 1)
            hider_col = random.randint(0, current_game.cols - 1)
            current_game.set_hider_position(hider_row, hider_col)

        # Rebuild the grid layout to send back to Angular
        grid_layout = []
        for row in range(current_game.rows):
            current_row = []
            for col in range(current_game.cols):
                is_hider = False
                if current_game.hider_position:
                    is_hider = (row == current_game.hider_position[0] and col == current_game.hider_position[1])

                current_row.append({
                    "row": row,
                    "col": col,
                    "value": int(current_game.matrix[row][col]),
                    "revealed": False,
                    "hider": is_hider
                })
            grid_layout.append(current_row)

        return jsonify({"success": True, "grid_layout": grid_layout}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/game-state', methods=['POST'])
def handle_game_state():
    """SEEKER MODE: User clicks, backend computes result"""
    global current_game
    if current_game is None:
        return jsonify({"error": "Game not initialized"}), 400

    try:
        data = request.json
        clicked_row = data.get('clicked_row')
        clicked_col = data.get('clicked_col')

        round_result = current_game.generate_place_and_compute(clicked_row, clicked_col)

        return jsonify({
            "success": True,
            "clicked_row": clicked_row,
            "clicked_col": clicked_col,
            "round_result": round_result,
            "updated_scores": {
                "seeker": current_game.seeker_score,
                "hider": current_game.hider_score
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/computer-guess', methods=['POST'])
def computer_guess():
    """HIDER MODE: User hides, computer seeks based on probabilities"""
    global current_game
    if current_game is None:
        return jsonify({"error": "Game not initialized"}), 400

    try:
        data = request.json
        hidden_row = data.get('hidden_row')
        hidden_col = data.get('hidden_col')

        # Set user's hiding spot
        current_game.set_hider_position(hidden_row, hidden_col)

        # Computer chooses where to smash using Simplex math
        guess_row, guess_col = current_game.get_computer_choice()

        # Compute the math
        result = current_game.generate_place_and_compute(guess_row, guess_col)

        return jsonify({
            "computer_guess_row": int(guess_row),
            "computer_guess_col": int(guess_col),
            "found_treasure": result['found'],
            "updated_scores": {
                "hider": current_game.hider_score,
                "seeker": current_game.seeker_score
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/simulate-round', methods=['POST'])
def simulate_round():
    """QUARTERMASTER MODE: Computer hides, Computer seeks"""
    global current_game
    if current_game is None:
        # Initialize a temporary game for the simulation round if needed
        data = request.json
        current_game = Game(data.get('rows', 3), data.get('columns', 3))

    try:
        # Hider picks spot using Simplex
        hider_row, hider_col = current_game.get_computer_choice()
        current_game.set_hider_position(hider_row, hider_col)

        # Seeker picks spot using Simplex
        seeker_row, seeker_col = current_game.get_computer_choice()

        # Compute math
        result = current_game.generate_place_and_compute(seeker_row, seeker_col)

        return jsonify({
            "hider_row": int(hider_row),
            "hider_col": int(hider_col),
            "seeker_row": int(seeker_row),
            "seeker_col": int(seeker_col),
            "found_treasure": result['found'],
            "updated_scores": {
                "hider": current_game.hider_score,
                "seeker": current_game.seeker_score
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🎮 Hide and Seek Game Server (Ahoy!)")
    print("="*60)
    print("Running on http://localhost:5000")
    print("="*60 + "\n")
    app.run(debug=True, host='localhost', port=5000)