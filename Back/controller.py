from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import numpy as np
from back import Game

app = Flask(__name__)
CORS(app)

# Global game instance
current_game = None

@app.route('/api/setup-game', methods=['POST'])
def setup_game():
    """
    Initialize a new game with specified dimensions.
    The player is the SEEKER, and the computer is the HIDER.
    """
    global current_game
    
    try:
        data = request.json
        rows = data.get('rows', 3)
        columns = data.get('columns', 3)
        role = data.get('role', 'seeker')
        
        print(f"\n🎮 Starting new game: {rows}x{columns}, Player role: {role}")
        
        # Create a new game instance
        current_game = Game(rows, columns)
        
        # Randomly position the hider (computer's position)
        hider_row = random.randint(0, rows - 1)
        hider_col = random.randint(0, columns - 1)
        current_game.set_hider_position(hider_row, hider_col)
        
        # Build the grid layout for the frontend
        # The frontend expects a 2D array representing the matrix where each object holds UI states
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
        
        # Extract probabilities
        hider_probs = current_game.probabilities.tolist()
        seeker_probs = current_game.probabilities.tolist()  # Both use same optimal strategy
        
        # Create payoff matrix in a serializable format
        payoff_matrix = current_game.pay_matrix.tolist()
        
        response = {
            "success": True,
            "rows": rows,
            "columns": columns,
            "payoff_matrix": payoff_matrix,
            "primal": hider_probs,  # Hider strategy
            "dual": seeker_probs,   # Seeker strategy
            "hider_probs": hider_probs,
            "seeker_probs": seeker_probs,
            "grid_layout": grid_layout,
            "game_value": float(current_game.strategy[0]) if len(current_game.strategy) > 0 else 0
        }
        
        print("\n✅ Game setup complete!")
        print(f"Grid sent to frontend with {len(grid_layout)} cells")
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Error during game setup: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/game-state', methods=['POST'])
def handle_game_state():
    """
    Process the seeker's move and calculate scores.
    The seeker clicks a cell, we check if it hits the hider.
    """
    global current_game
    
    if current_game is None:
        return jsonify({"error": "Game not initialized"}), 400
    
    try:
        data = request.json
        clicked_row = data.get('clicked_row')
        clicked_col = data.get('clicked_col')
        
        if clicked_row is None or clicked_col is None:
            return jsonify({"error": "Missing clicked_row or clicked_col"}), 400
        
        # Compute the result of this move
        round_result = current_game.generate_place_and_compute(clicked_row, clicked_col)
        
        # Prepare response with updated scores
        response = {
            "success": True,
            "clicked_row": clicked_row,
            "clicked_col": clicked_col,
            "round_result": round_result,
            "updated_scores": {
                "seeker": current_game.seeker_score,
                "hider": current_game.hider_score
            },
            "hider_position": {
                "row": current_game.hider_position[0],
                "col": current_game.hider_position[1]
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Error processing game state: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/game-status', methods=['GET'])
def get_game_status():
    """
    Get current game status and scores without processing a move.
    """
    global current_game
    
    if current_game is None:
        return jsonify({"error": "Game not initialized"}), 400
    
    try:
        response = {
            "seeker_score": current_game.seeker_score,
            "hider_score": current_game.hider_score,
            "rows": current_game.rows,
            "cols": current_game.cols,
            "hider_position": {
                "row": current_game.hider_position[0],
                "col": current_game.hider_position[1]
            }
        }
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Error getting game status: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/reset-game', methods=['POST'])
def reset_game():
    """
    Reset the game state.
    """
    global current_game
    current_game = None
    return jsonify({"success": True, "message": "Game reset"}), 200


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🎮 Hide and Seek Game Server")
    print("="*60)
    print("Running on http://localhost:5000")
    print("Endpoints:")
    print("  POST /api/setup-game      - Initialize new game")
    print("  POST /api/game-state      - Process seeker move")
    print("  GET  /api/game-status     - Get current scores")
    print("  POST /api/reset-game      - Reset game state")
    print("="*60 + "\n")
    
    app.run(debug=True, host='localhost', port=5000)
