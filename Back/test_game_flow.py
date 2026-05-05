"""
Test script to verify the Hide and Seek game flow works correctly.
This simulates what the frontend will do.
"""

from back import Game
import random

print("\n" + "="*60)
print("🎮 HIDE AND SEEK GAME TEST")
print("="*60)

# Step 1: Create a game (like setup-game endpoint)
print("\n📋 Step 1: Initializing game (3x3)...")
game = Game(3, 3)

# Step 2: Place hider randomly
hider_row = random.randint(0, game.rows - 1)
hider_col = random.randint(0, game.cols - 1)
game.set_hider_position(hider_row, hider_col)

# Step 3: Simulate several seeker moves
print("\n" + "="*60)
print("🎮 SIMULATING GAME MOVES")
print("="*60)

moves = [
    (0, 0),
    (1, 1),
    (2, 2),
    (hider_row, hider_col),  # This should hit!
]

for i, (row, col) in enumerate(moves, 1):
    print(f"\n🔄 Move {i}:")
    result = game.generate_place_and_compute(row, col)
    print(f"   Result: {result}")
    print(f"   Seeker Score: {game.seeker_score}")
    print(f"   Hider Score: {game.hider_score}")

# Step 4: Show final scores
print("\n" + "="*60)
print("🏆 FINAL RESULTS")
print("="*60)
print(f"🎯 Seeker Score: {game.seeker_score}")
print(f"🙈 Hider Score: {game.hider_score}")

if game.seeker_score > game.hider_score:
    print("\n✅ SEEKER WINS!")
elif game.hider_score > game.seeker_score:
    print("\n✅ HIDER WINS!")
else:
    print("\n🤝 TIE GAME!")

print("\n" + "="*60 + "\n")
