import heapq
import math

class Node:
    def __init__(self, position, parent=None):
        self.position = position
        self.parent = parent
        self.g = 0  # Cost from start to current node
        self.h = 0  # Heuristic cost from current node to end
        self.f = 0  # Total cost (g + h)

    def __eq__(self, other):
        return self.position == other.position

    def __lt__(self, other):
        return self.f < other.f

def heuristic(current, goal):
    """
    Euclidean distance for diagonal movement support.
    """
    return math.sqrt((current[0] - goal[0])**2 + (current[1] - goal[1])**2)

def a_star(grid, start, end):
    """
    A* algorithm implementation.
    grid: 2D list where 0 is walkable and 1 is an obstacle.
    start: (row, col) tuple
    end: (row, col) tuple
    returns: List of (row, col) tuples representing the path.
    """
    rows = len(grid)
    cols = len(grid[0])
    
    start_node = Node(start)
    end_node = Node(end)
    
    open_list = []
    closed_set = set()
    
    heapq.heappush(open_list, start_node)
    
    # Neighborhood definition (8 directions for diagonal support)
    neighbors = [
        (0, -1, 1), (0, 1, 1), (-1, 0, 1), (1, 0, 1), # Cardinal
        (-1, -1, math.sqrt(2)), (-1, 1, math.sqrt(2)), # Diagonal
        (1, -1, math.sqrt(2)), (1, 1, math.sqrt(2))    # Diagonal
    ]
    
    while open_list:
        current_node = heapq.heappop(open_list)
        closed_set.add(current_node.position)
        
        # Check if we reached the goal
        if current_node.position == end_node.position:
            path = []
            while current_node:
                path.append(current_node.position)
                current_node = current_node.parent
            return path[::-1] # Return reversed path
        
        for move_row, move_col, cost in neighbors:
            node_pos = (current_node.position[0] + move_row, current_node.position[1] + move_col)
            
            # Check boundaries
            if not (0 <= node_pos[0] < rows and 0 <= node_pos[1] < cols):
                continue
            
            # Check if obstacle
            if grid[node_pos[0]][node_pos[1]] == 1:
                continue
                
            if node_pos in closed_set:
                continue
            
            neighbor_node = Node(node_pos, current_node)
            neighbor_node.g = current_node.g + cost
            neighbor_node.h = heuristic(node_pos, end_node.position)
            neighbor_node.f = neighbor_node.g + neighbor_node.h
            
            # Check if neighbor is already in open_list with a lower g value
            is_better = True
            for open_node in open_list:
                if open_node.position == neighbor_node.position and open_node.g <= neighbor_node.g:
                    is_better = False
                    break
            
            if is_better:
                heapq.heappush(open_list, neighbor_node)
                
    return None # No path found
