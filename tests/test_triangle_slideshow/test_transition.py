"""
Tests for the transition module.

This module tests the functionality of the transition.py module.
"""

import pytest
import numpy as np
from unittest.mock import patch, MagicMock

from triangle_slideshow.transition import (
    calculate_centroid,
    calculate_cost_matrix,
    create_transition,
)
from tests.test_triangle_slideshow.fixtures import (
    SAMPLE_TRIANGLE,
    SAMPLE_TRIANGLE_CENTROID,
    TRIANGLES_SET_A,
    TRIANGLES_SET_B,
    EXPECTED_COST_MATRIX,
    EXPECTED_PAIRINGS,
)


class TestCalculateCentroid:
    """Tests for the calculate_centroid function."""

    def test_calculates_correct_centroid(self):
        """Test that calculate_centroid calculates the correct centroid of a triangle."""
        # Act
        result = calculate_centroid(SAMPLE_TRIANGLE["coordinates"])

        # Assert - check approximate equality due to floating point precision
        np.testing.assert_almost_equal(result, SAMPLE_TRIANGLE_CENTROID, decimal=6)

    def test_handles_different_triangle_shapes(self):
        """Test that calculate_centroid handles triangles with different shapes."""
        # Arrange
        triangles = [
            [[0, 0], [10, 0], [5, 10]],  # Standard triangle
            [[0, 0], [0, 10], [10, 0]],  # Right triangle
            [[0, 0], [10, 0], [10, 10]],  # Right triangle (different)
        ]
        expected_centroids = [[5, 3.333333], [3.333333, 3.333333], [6.666667, 3.333333]]

        # Act & Assert
        for triangle, expected in zip(triangles, expected_centroids):
            result = calculate_centroid(triangle)
            np.testing.assert_almost_equal(result, expected, decimal=6)


class TestCalculateCostMatrix:
    """Tests for the calculate_cost_matrix function."""

    def test_calculates_correct_cost_matrix(self):
        """Test that calculate_cost_matrix calculates correctly."""
        # Act
        result = calculate_cost_matrix(TRIANGLES_SET_A, TRIANGLES_SET_B)

        # Assert
        expected = np.array(EXPECTED_COST_MATRIX)
        # Round to 2 decimal places for comparison
        np.testing.assert_almost_equal(result, expected, decimal=2)

    @patch("builtins.print")  # Mock print to avoid cluttering test output
    def test_handles_empty_triangle_sets(self, mock_print):
        """Test that calculate_cost_matrix handles empty triangle sets."""
        # Act & Assert
        with pytest.raises(ValueError):
            calculate_cost_matrix([], TRIANGLES_SET_B)

        with pytest.raises(ValueError):
            calculate_cost_matrix(TRIANGLES_SET_A, [])

    @patch("builtins.print")  # Mock print to avoid cluttering test output
    def test_reports_progress_for_large_sets(self, mock_print):
        """Test that calculate_cost_matrix reports progress for large sets."""
        # Arrange - Create large triangle sets
        large_set_a = [TRIANGLES_SET_A[0]] * 1001  # 1001 identical triangles
        large_set_b = [TRIANGLES_SET_B[0]] * 5

        # Act
        calculate_cost_matrix(large_set_a, large_set_b)

        # Assert - Check that progress was reported
        assert any("Processed" in str(call) for call in mock_print.call_args_list)


class TestCreateTransition:
    """Tests for the create_transition function."""

    @patch("triangle_slideshow.transition.calculate_cost_matrix")
    @patch("triangle_slideshow.transition.linear_sum_assignment")
    @patch("builtins.print")  # Mock print to avoid cluttering test output
    def test_creates_correct_pairings(self, mock_print, mock_lsa, mock_ccm):
        """Test that create_transition creates correct pairings."""
        # Arrange
        mock_ccm.return_value = np.array(EXPECTED_COST_MATRIX)
        # linear_sum_assignment returns row indices and column indices
        mock_lsa.return_value = ([0, 1, 2], [0, 1, 2])

        # Act
        result = create_transition(TRIANGLES_SET_A, TRIANGLES_SET_B)

        # Assert
        expected = EXPECTED_PAIRINGS
        assert len(result) == len(expected)
        for r, e in zip(result, expected):
            assert r["from_index"] == e["from_index"]
            assert r["to_index"] == e["to_index"]
            np.testing.assert_almost_equal(r["distance"], e["distance"], decimal=2)

    def test_handles_max_triangles_limit(self):
        """Test that create_transition respects the max_triangles limit."""
        # Arrange
        max_triangles = 2

        # Act
        result = create_transition(
            TRIANGLES_SET_A, TRIANGLES_SET_B, max_triangles=max_triangles
        )

        # Assert - should only process the first 2 triangles from each set
        assert len(result) == max_triangles

    def test_handles_different_size_triangle_sets(self):
        """Test that create_transition handles triangle sets of different sizes."""
        # Arrange
        triangles_a = TRIANGLES_SET_A[:2]  # First 2 triangles
        triangles_b = TRIANGLES_SET_B  # All 3 triangles

        # Act
        result = create_transition(triangles_a, triangles_b)

        # Assert - should create pairings for the smaller set (2 pairings)
        assert len(result) == 2

    @patch("triangle_slideshow.transition.calculate_cost_matrix")
    @patch("triangle_slideshow.transition.linear_sum_assignment")
    @patch("builtins.print")  # Mock print to avoid cluttering test output
    def test_swaps_sets_when_b_is_smaller(self, mock_print, mock_lsa, mock_ccm):
        """Test that create_transition swaps sets when triangles_b is smaller."""
        # Arrange
        mock_ccm.return_value = np.array([[7.07]])
        mock_lsa.return_value = ([0], [0])
        triangles_a = TRIANGLES_SET_A  # All 3 triangles
        triangles_b = TRIANGLES_SET_B[:1]  # First triangle only

        # Act
        result = create_transition(triangles_a, triangles_b)

        # Assert - check that the function handled the swap correctly
        assert len(result) == 1
        assert result[0]["from_index"] == 0
        assert result[0]["to_index"] == 0

        # Verify that calculate_cost_matrix was called with triangles_b as rows
        mock_ccm.assert_called_once()
        args = mock_ccm.call_args[0]
        assert len(args[0]) == 1  # First arg should be triangles_b (smaller)
        assert len(args[1]) == 3  # Second arg should be triangles_a (larger)


# Test with property-based testing (with larger random sets)
class TestScalingBehavior:
    """Tests for scaling behavior of the transition module."""

    @pytest.mark.parametrize("size", [10, 20, 50])
    def test_transition_scaling(self, size):
        """Test that create_transition scales properly with triangle set size."""
        # Arrange - Create random triangle sets
        triangles_a = []
        triangles_b = []

        for i in range(size):
            # Create triangles with random coordinates
            triangle_a = {
                "coordinates": [
                    [np.random.randint(0, 100), np.random.randint(0, 100)],
                    [np.random.randint(0, 100), np.random.randint(0, 100)],
                    [np.random.randint(0, 100), np.random.randint(0, 100)],
                ],
                "color": [np.random.randint(0, 255) for _ in range(3)],
            }
            triangle_b = {
                "coordinates": [
                    [np.random.randint(0, 100), np.random.randint(0, 100)],
                    [np.random.randint(0, 100), np.random.randint(0, 100)],
                    [np.random.randint(0, 100), np.random.randint(0, 100)],
                ],
                "color": [np.random.randint(0, 255) for _ in range(3)],
            }
            triangles_a.append(triangle_a)
            triangles_b.append(triangle_b)

        # Act
        result = create_transition(triangles_a, triangles_b)

        # Assert
        assert len(result) == size
        # Check that all pairings have valid indices and distances
        for pairing in result:
            assert 0 <= pairing["from_index"] < size
            assert 0 <= pairing["to_index"] < size
            assert pairing["distance"] >= 0
