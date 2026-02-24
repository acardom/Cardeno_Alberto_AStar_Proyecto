import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from logic.astar import a_star

def test_astar():
    # Simple 5x5 grid
    grid = [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 1, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0]
    ]
    start = (0, 0)
    end = (4, 4)
    
    path = a_star(grid, start, end)
    print(f"Path found: {path}")
    
    if path:
        print("Test Passed: Path found!")
    else:
        print("Test Failed: No path found!")

if __name__ == "__main__":
    test_astar()
