"""
Test fixtures for triangle slideshow package tests.

This module provides predefined triangle sets and other test data.
"""

# Sample triangle with known coordinates and center
SAMPLE_TRIANGLE = {"coordinates": [[0, 0], [10, 0], [5, 10]], "color": [255, 0, 0]}

# Known centroid for SAMPLE_TRIANGLE
SAMPLE_TRIANGLE_CENTROID = [5, 3.3333333333333335]

# Set of triangles for testing transitions
TRIANGLES_SET_A = [
    {"coordinates": [[0, 0], [10, 0], [5, 10]], "color": [255, 0, 0]},
    {"coordinates": [[20, 0], [30, 0], [25, 10]], "color": [0, 255, 0]},
    {"coordinates": [[40, 0], [50, 0], [45, 10]], "color": [0, 0, 255]},
]

# Second set of triangles for testing transitions
TRIANGLES_SET_B = [
    {"coordinates": [[5, 5], [15, 5], [10, 15]], "color": [255, 255, 0]},
    {"coordinates": [[25, 5], [35, 5], [30, 15]], "color": [0, 255, 255]},
    {"coordinates": [[45, 5], [55, 5], [50, 15]], "color": [255, 0, 255]},
]

# Expected cost matrix for TRIANGLES_SET_A and TRIANGLES_SET_B
# The Euclidean distance between the centroids
EXPECTED_COST_MATRIX = [
    [7.07, 25.50, 45.28],
    [15.81, 7.07, 25.50],
    [35.36, 15.81, 7.07],
]

# Expected pairings between TRIANGLES_SET_A and TRIANGLES_SET_B
EXPECTED_PAIRINGS = [
    {"from_index": 0, "to_index": 0, "distance": 7.07},
    {"from_index": 1, "to_index": 1, "distance": 7.07},
    {"from_index": 2, "to_index": 2, "distance": 7.07},
]

# Sample slide data for slideshow tests
SAMPLE_SLIDE_A = {"name": "slide_0", "triangles": TRIANGLES_SET_A}

SAMPLE_SLIDE_B = {"name": "slide_1", "triangles": TRIANGLES_SET_B}

# Sample transition data
SAMPLE_TRANSITION = {"from": 0, "to": 1, "pairings": EXPECTED_PAIRINGS}

# Complete slideshow for serialization tests
SAMPLE_SLIDESHOW_DICT = {
    "slides": [SAMPLE_SLIDE_A, SAMPLE_SLIDE_B],
    "transitions": [SAMPLE_TRANSITION],
}

# Empty slideshow for edge case testing
EMPTY_SLIDESHOW_DICT = {"slides": [], "transitions": []}

# Single slide slideshow for edge case testing
SINGLE_SLIDE_SLIDESHOW_DICT = {"slides": [SAMPLE_SLIDE_A], "transitions": []}
