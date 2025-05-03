"""
Transition module for triangle slideshow.

This module handles creating transitions between triangle sets using the Hungarian algorithm.
"""

import numpy as np
from scipy.optimize import linear_sum_assignment
import time


def calculate_centroid(triangle_coords):
    """Calculate centroid of a triangle from its coordinates."""
    points = np.array(triangle_coords)
    return np.mean(points, axis=0)


def calculate_cost_matrix(triangles_a, triangles_b):
    """
    Calculate cost matrix for the Hungarian algorithm.
    Cost is the Euclidean distance between triangle centroids.

    Args:
        triangles_a (list): First set of triangles
        triangles_b (list): Second set of triangles

    Returns:
        np.ndarray: Cost matrix where each cell is the distance between centroids

    Raises:
        ValueError: If either triangle set is empty
    """
    # Check for empty triangle sets
    if not triangles_a or not triangles_b:
        raise ValueError("Triangle sets cannot be empty")

    print(
        f"Calculating cost matrix for {len(triangles_a)} x {len(triangles_b)} triangles..."
    )
    start_time = time.time()

    # Pre-calculate all centroids
    centroids_a = [calculate_centroid(t["coordinates"]) for t in triangles_a]
    centroids_b = [calculate_centroid(t["coordinates"]) for t in triangles_b]

    # Create cost matrix
    cost_matrix = np.zeros((len(triangles_a), len(triangles_b)))

    for i, centroid_a in enumerate(centroids_a):
        if i % 1000 == 0 and i > 0:
            print(f"  Processed {i}/{len(triangles_a)} triangles...")

        for j, centroid_b in enumerate(centroids_b):
            # Euclidean distance between centroids
            cost_matrix[i, j] = np.linalg.norm(centroid_a - centroid_b)

    elapsed = time.time() - start_time
    print(f"Cost matrix calculation completed in {elapsed:.2f} seconds")
    return cost_matrix


def create_transition(triangles_from, triangles_to, max_triangles=None):
    """
    Create a transition between two sets of triangles using the Hungarian algorithm.

    Args:
        triangles_from (list): Source triangle set
        triangles_to (list): Target triangle set
        max_triangles (int, optional): Maximum number of triangles to use (for memory optimization)

    Returns:
        list: List of pairings (dictionaries with from_index, to_index, distance keys)
    """
    # Limit triangles if specified (for memory efficiency)
    if max_triangles:
        source_triangles = triangles_from[:max_triangles]
        target_triangles = triangles_to[:max_triangles]
    else:
        source_triangles = triangles_from
        target_triangles = triangles_to

    # Determine which set needs to be the rows (smaller set)
    if len(source_triangles) <= len(target_triangles):
        row_triangles, col_triangles = source_triangles, target_triangles
        is_source_rows = True
    else:
        row_triangles, col_triangles = target_triangles, source_triangles
        is_source_rows = False

    # Calculate cost matrix
    cost_matrix = calculate_cost_matrix(row_triangles, col_triangles)

    # Apply Hungarian algorithm
    print("Running Hungarian algorithm...")
    start_time = time.time()
    row_indices, col_indices = linear_sum_assignment(cost_matrix)
    elapsed = time.time() - start_time
    print(f"Hungarian algorithm completed in {elapsed:.2f} seconds")

    # Convert assignments to pairings
    pairings = []
    for row_idx, col_idx in zip(row_indices, col_indices):
        if is_source_rows:
            # Source is rows, target is columns
            pairings.append(
                {
                    "from_index": int(row_idx),
                    "to_index": int(col_idx),
                    "distance": float(cost_matrix[row_idx, col_idx]),
                }
            )
        else:
            # Target is rows, source is columns
            pairings.append(
                {
                    "from_index": int(col_idx),
                    "to_index": int(row_idx),
                    "distance": float(cost_matrix[row_idx, col_idx]),
                }
            )

    print(f"Created {len(pairings)} triangle pairings")
    return pairings
