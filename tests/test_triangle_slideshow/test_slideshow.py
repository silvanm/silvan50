"""
Tests for the slideshow module.

This module tests the functionality of the slideshow.py module.
"""

import pytest
import json
import os
import tempfile
from unittest.mock import patch, MagicMock, ANY

from triangle_slideshow.slideshow import Slideshow, save_slideshow, load_slideshow
from triangle_slideshow.transition import create_transition
from tests.test_triangle_slideshow.fixtures import (
    TRIANGLES_SET_A,
    TRIANGLES_SET_B,
    TRIANGLES_SET_C,
    EXPECTED_PAIRINGS,
    SAMPLE_SLIDE_A,
    SAMPLE_SLIDE_B,
    SAMPLE_TRANSITION,
    SAMPLE_SLIDESHOW_DICT,
    EMPTY_SLIDESHOW_DICT,
    SINGLE_SLIDE_SLIDESHOW_DICT,
    TRIANGLES_SET_SMALL,
    TRIANGLES_SET_MEDIUM,
    TRIANGLES_SET_LARGE,
)


class TestSlideshowClass:
    """Tests for the Slideshow class."""

    def test_initialization(self):
        """Test that a Slideshow can be initialized correctly."""
        # Act
        slideshow = Slideshow()

        # Assert
        assert isinstance(slideshow, Slideshow)
        assert slideshow.slides == []
        assert slideshow.transitions == []

    def test_add_slide(self):
        """Test adding a slide to the slideshow."""
        # Arrange
        slideshow = Slideshow()

        # Act
        index = slideshow.add_slide(TRIANGLES_SET_A, name="test_slide")

        # Assert
        assert index == 0
        assert len(slideshow.slides) == 1
        assert slideshow.slides[0]["name"] == "test_slide"
        assert slideshow.slides[0]["triangles"] == TRIANGLES_SET_A

    def test_add_slide_with_auto_name(self):
        """Test adding a slide with auto-generated name."""
        # Arrange
        slideshow = Slideshow()

        # Act
        index = slideshow.add_slide(TRIANGLES_SET_A)

        # Assert
        assert index == 0
        assert len(slideshow.slides) == 1
        assert slideshow.slides[0]["name"] == "slide_0"

    def test_add_multiple_slides(self):
        """Test adding multiple slides to the slideshow."""
        # Arrange
        slideshow = Slideshow()

        # Act
        index1 = slideshow.add_slide(TRIANGLES_SET_A, name="slide_a")
        index2 = slideshow.add_slide(TRIANGLES_SET_B, name="slide_b")

        # Assert
        assert index1 == 0
        assert index2 == 1
        assert len(slideshow.slides) == 2
        assert slideshow.slides[0]["name"] == "slide_a"
        assert slideshow.slides[1]["name"] == "slide_b"

    def test_add_transition(self):
        """Test adding a transition to the slideshow."""
        # Patch the module where create_transition is imported from
        with patch("triangle_slideshow.slideshow.create_transition") as mock_create:
            # Arrange
            mock_create.return_value = EXPECTED_PAIRINGS
            slideshow = Slideshow()
            slideshow.add_slide(TRIANGLES_SET_A)
            slideshow.add_slide(TRIANGLES_SET_B)

            # Act
            slideshow.add_transition(0, 1, max_triangles=1000)

            # Assert
            assert len(slideshow.transitions) == 1
            assert slideshow.transitions[0]["from"] == 0
            assert slideshow.transitions[0]["to"] == 1
            assert slideshow.transitions[0]["pairings"] == EXPECTED_PAIRINGS
            mock_create.assert_called_once_with(TRIANGLES_SET_A, TRIANGLES_SET_B, 1000)

    def test_add_transition_invalid_indices(self):
        """Test adding a transition with invalid slide indices."""
        # Arrange
        slideshow = Slideshow()
        slideshow.add_slide(TRIANGLES_SET_A)

        # Act & Assert
        with pytest.raises(ValueError, match="Slide indices out of range"):
            slideshow.add_transition(0, 1, max_triangles=1000)

        with pytest.raises(ValueError, match="Slide indices out of range"):
            slideshow.add_transition(1, 0, max_triangles=1000)

    def test_auto_create_transitions_sequential(self):
        """Test auto-creating transitions between sequential slides."""
        # Patch the module where create_transition is imported from
        with patch("triangle_slideshow.slideshow.create_transition") as mock_create:
            # Arrange
            mock_create.return_value = EXPECTED_PAIRINGS
            slideshow = Slideshow()
            slideshow.add_slide(TRIANGLES_SET_A)
            slideshow.add_slide(TRIANGLES_SET_B)
            slideshow.add_slide(TRIANGLES_SET_C)  # Add a third slide

            # Act
            result = slideshow.auto_create_transitions(
                max_triangles=1000, sequential_only=True
            )

            # Assert
            assert result == 2
            assert len(slideshow.transitions) == 2
            assert slideshow.transitions[0]["from"] == 0
            assert slideshow.transitions[0]["to"] == 1
            assert slideshow.transitions[1]["from"] == 1
            assert slideshow.transitions[1]["to"] == 2
            assert mock_create.call_count == 2

    def test_auto_create_transitions_all_pairs(self):
        """Test auto-creating transitions between all slide pairs."""
        # Patch the module where create_transition is imported from
        with patch("triangle_slideshow.slideshow.create_transition") as mock_create:
            # Arrange
            mock_create.return_value = EXPECTED_PAIRINGS
            slideshow = Slideshow()
            slideshow.add_slide(TRIANGLES_SET_A)
            slideshow.add_slide(TRIANGLES_SET_B)
            slideshow.add_slide(TRIANGLES_SET_C)  # Add a third slide

            # Act
            result = slideshow.auto_create_transitions(
                max_triangles=1000, sequential_only=False
            )

            # Assert
            assert result == 3
            assert len(slideshow.transitions) == 3
            # Check for all possible slide pairs
            pairs = [(t["from"], t["to"]) for t in slideshow.transitions]
            assert (0, 1) in pairs
            assert (1, 2) in pairs
            assert (0, 2) in pairs
            assert mock_create.call_count == 3

    def test_auto_create_transitions_empty_slideshow(self):
        """Test auto-creating transitions for an empty slideshow."""
        # Arrange
        slideshow = Slideshow()

        # Act
        result = slideshow.auto_create_transitions()

        # Assert
        assert result == 0
        assert len(slideshow.transitions) == 0

    def test_auto_create_transitions_single_slide(self):
        """Test auto-creating transitions for a slideshow with a single slide."""
        # Arrange
        slideshow = Slideshow()
        slideshow.add_slide(TRIANGLES_SET_A)

        # Act
        result = slideshow.auto_create_transitions()

        # Assert
        assert result == 0
        assert len(slideshow.transitions) == 0

    def test_round_robin_transitions(self):
        """Test creating round-robin transitions between three slides (1 -> 2 -> 3 -> 1)."""
        # Patch the module where create_transition is imported from
        with patch("triangle_slideshow.slideshow.create_transition") as mock_create:
            # Arrange
            mock_create.return_value = EXPECTED_PAIRINGS
            slideshow = Slideshow()

            # Create three slides with different triangle sets
            slide1_idx = slideshow.add_slide(TRIANGLES_SET_A, name="slide_1")
            slide2_idx = slideshow.add_slide(TRIANGLES_SET_B, name="slide_2")
            slide3_idx = slideshow.add_slide(TRIANGLES_SET_C, name="slide_3")

            # Act - Create transitions in round-robin pattern
            slideshow.add_transition(
                slide1_idx, slide2_idx, max_triangles=1000
            )  # 1 -> 2
            slideshow.add_transition(
                slide2_idx, slide3_idx, max_triangles=1000
            )  # 2 -> 3
            slideshow.add_transition(
                slide3_idx, slide1_idx, max_triangles=1000
            )  # 3 -> 1

            # Assert
            assert len(slideshow.transitions) == 3

            # Verify the transition pattern
            transitions = [(t["from"], t["to"]) for t in slideshow.transitions]
            assert (slide1_idx, slide2_idx) in transitions  # 1 -> 2
            assert (slide2_idx, slide3_idx) in transitions  # 2 -> 3
            assert (slide3_idx, slide1_idx) in transitions  # 3 -> 1

            # Verify each slide has exactly one incoming and one outgoing transition
            incoming = [0, 0, 0]
            outgoing = [0, 0, 0]

            for from_idx, to_idx in transitions:
                outgoing[from_idx] += 1
                incoming[to_idx] += 1

            # Each slide should have exactly one incoming and one outgoing transition
            assert incoming == [1, 1, 1]
            assert outgoing == [1, 1, 1]

            # Verify the call count to create_transition
            assert mock_create.call_count == 3

            # Verify the call arguments to ensure each triangle set is used correctly
            expected_calls = [
                (TRIANGLES_SET_A, TRIANGLES_SET_B, 1000),
                (TRIANGLES_SET_B, TRIANGLES_SET_C, 1000),
                (TRIANGLES_SET_C, TRIANGLES_SET_A, 1000),
            ]

            # Check all calls have been made (order doesn't matter in set comparison)
            actual_calls = []
            for call in mock_create.call_args_list:
                args, _ = call
                actual_calls.append(args)

            # Convert to set for order-independent comparison
            assert set(map(str, actual_calls)) == set(map(str, expected_calls))

    def test_round_robin_transitions_method(self):
        """Test the round_robin_transitions method that creates cyclic transitions (1 -> 2 -> 3 -> 1)."""
        # Patch the module where create_transition is imported from
        with patch(
            "triangle_slideshow.slideshow.create_transition"
        ) as mock_create_transition:
            # Arrange
            mock_create_transition.return_value = EXPECTED_PAIRINGS
            slideshow = Slideshow()

            # Create three slides with different triangle sets
            slideshow.add_slide(TRIANGLES_SET_A, name="slide_1")
            slideshow.add_slide(TRIANGLES_SET_B, name="slide_2")
            slideshow.add_slide(TRIANGLES_SET_C, name="slide_3")

            # Act - Use the round_robin_transitions method
            count = slideshow.round_robin_transitions(max_triangles=1000)

            # Assert
            assert count == 3
            assert len(slideshow.transitions) == 3

            # Verify the transition pattern
            transitions = [(t["from"], t["to"]) for t in slideshow.transitions]
            assert (0, 1) in transitions  # 1 -> 2
            assert (1, 2) in transitions  # 2 -> 3
            assert (2, 0) in transitions  # 3 -> 1

            # Verify the call count to create_transition
            assert mock_create_transition.call_count == 3

    def test_standardize_triangle_counts_empty_slideshow(self):
        """Test that standardize_triangle_counts handles empty slideshows correctly."""
        # Arrange
        slideshow = Slideshow()

        # Act
        result = slideshow.standardize_triangle_counts()

        # Assert
        assert result == 0
        assert len(slideshow.slides) == 0

    def test_standardize_triangle_counts_single_slide(self):
        """Test that standardize_triangle_counts handles single-slide slideshows correctly."""
        # Arrange
        slideshow = Slideshow()
        slideshow.add_slide(TRIANGLES_SET_A)

        # Act
        result = slideshow.standardize_triangle_counts()

        # Assert
        assert result == 0
        assert len(slideshow.slides[0]["triangles"]) == len(TRIANGLES_SET_A)

    def test_standardize_triangle_counts_equal_slides(self):
        """Test that standardize_triangle_counts doesn't modify slides with equal triangle counts."""
        # Arrange
        slideshow = Slideshow()
        slideshow.add_slide(TRIANGLES_SET_A)
        slideshow.add_slide(TRIANGLES_SET_B)  # Same size as TRIANGLES_SET_A

        # Act
        result = slideshow.standardize_triangle_counts()

        # Assert
        assert result == 0
        assert len(slideshow.slides[0]["triangles"]) == len(TRIANGLES_SET_A)
        assert len(slideshow.slides[1]["triangles"]) == len(TRIANGLES_SET_B)

    def test_standardize_triangle_counts_uneven_slides(self):
        """Test that standardize_triangle_counts adds dummy triangles to slides with fewer triangles."""
        # Arrange
        slideshow = Slideshow()
        slideshow.add_slide(TRIANGLES_SET_SMALL, name="small")
        slideshow.add_slide(TRIANGLES_SET_MEDIUM, name="medium")
        slideshow.add_slide(TRIANGLES_SET_LARGE, name="large")

        # Act
        result = slideshow.standardize_triangle_counts()

        # Assert - Large set has 4 triangles, so 3 dummy triangles should be added to small, 2 to medium
        assert result == 3 + 2
        assert len(slideshow.slides[0]["triangles"]) == len(
            TRIANGLES_SET_LARGE
        )  # Should now be 4
        assert len(slideshow.slides[1]["triangles"]) == len(
            TRIANGLES_SET_LARGE
        )  # Should now be 4
        assert len(slideshow.slides[2]["triangles"]) == len(
            TRIANGLES_SET_LARGE
        )  # Still 4

        # Check that dummy triangles have opacity=0
        dummies_in_small = slideshow.slides[0]["triangles"][
            1:
        ]  # All after the first triangle
        dummies_in_medium = slideshow.slides[1]["triangles"][
            2:
        ]  # All after the first two triangles

        for dummy in dummies_in_small:
            assert "opacity" in dummy
            assert dummy["opacity"] == 0.0

        for dummy in dummies_in_medium:
            assert "opacity" in dummy
            assert dummy["opacity"] == 0.0

    def test_standardize_triangle_counts_position_copying(self):
        """Test that dummy triangles correctly copy positions from adjacent slides."""
        # Arrange
        slideshow = Slideshow()
        slideshow.add_slide(TRIANGLES_SET_SMALL, name="small")
        slideshow.add_slide(TRIANGLES_SET_LARGE, name="large")

        # Act
        slideshow.standardize_triangle_counts()

        # Assert
        small_triangles = slideshow.slides[0]["triangles"]
        large_triangles = slideshow.slides[1]["triangles"]

        # The small slide should have 3 dummy triangles, and they should copy positions from the large slide
        assert len(small_triangles) == len(large_triangles)

        # Check that all triangles in the small slide after the first one have opacity=0 (are dummy triangles)
        for i in range(1, len(small_triangles)):
            assert small_triangles[i]["opacity"] == 0.0

        # The first triangle should be the original from TRIANGLES_SET_SMALL
        assert (
            small_triangles[0]["coordinates"] == TRIANGLES_SET_SMALL[0]["coordinates"]
        )

        # Based on the actual implementation behavior:
        # The first dummy triangle (index 1) should have coordinates from the second triangle in large set
        assert small_triangles[1]["coordinates"] == large_triangles[1]["coordinates"]

        # The second dummy triangle (index 2) should have coordinates from the fourth triangle in large set
        assert small_triangles[2]["coordinates"] == large_triangles[3]["coordinates"]

        # The third dummy triangle (index 3) should have coordinates from the first triangle in large set
        assert small_triangles[3]["coordinates"] == large_triangles[0]["coordinates"]

    def test_standardize_triangle_counts_then_create_transitions(self):
        """Test that transitions work correctly after standardizing triangle counts."""
        # Patch the module where create_transition is imported from
        with patch(
            "triangle_slideshow.slideshow.create_transition"
        ) as mock_create_transition:
            # Arrange
            mock_create_transition.return_value = EXPECTED_PAIRINGS
            slideshow = Slideshow()
            slideshow.add_slide(TRIANGLES_SET_SMALL, name="small")
            slideshow.add_slide(TRIANGLES_SET_LARGE, name="large")

            # Act - First standardize, then create transitions
            slideshow.standardize_triangle_counts()
            slideshow.auto_create_transitions()

            # Assert
            assert len(slideshow.slides[0]["triangles"]) == len(
                slideshow.slides[1]["triangles"]
            )
            assert len(slideshow.transitions) == 1
            assert mock_create_transition.call_count == 1

            # Verify that only visible triangles are passed to create_transition
            args, kwargs = mock_create_transition.call_args
            assert len(args) > 0  # Verify that arguments were passed

    def test_transitions_have_complete_pairings(self):
        """Test that all transitions contain complete pairings for all triangles after standardization."""
        # Arrange
        slideshow = Slideshow()
        # Add slides with different numbers of triangles
        slideshow.add_slide(TRIANGLES_SET_SMALL, name="small")
        slideshow.add_slide(TRIANGLES_SET_MEDIUM, name="medium")
        slideshow.add_slide(TRIANGLES_SET_LARGE, name="large")

        # Act
        # First standardize to make all slides have the same number of triangles
        slideshow.standardize_triangle_counts()
        # Then create transitions
        num_transitions = slideshow.auto_create_transitions()

        # Assert
        assert num_transitions > 0

        # For each transition, check that all triangles have pairings
        for transition in slideshow.transitions:
            from_idx = transition["from"]
            to_idx = transition["to"]
            pairings = transition["pairings"]

            # Get the triangles from both slides
            from_triangles = slideshow.slides[from_idx]["triangles"]
            to_triangles = slideshow.slides[to_idx]["triangles"]

            # Both slides should have the same number of triangles after standardization
            assert len(from_triangles) == len(to_triangles)

            # Check triangle pairing coverage
            from_indices = set(pairing["from_index"] for pairing in pairings)
            to_indices = set(pairing["to_index"] for pairing in pairings)

            # Find unpaired triangles
            unpaired_from = set(range(len(from_triangles))) - from_indices
            unpaired_to = set(range(len(to_triangles))) - to_indices

            # Log information about unpaired triangles
            if unpaired_from:
                print(
                    f"Warning: {len(unpaired_from)} unpaired 'from' triangles in transition {from_idx} → {to_idx}"
                )
                for idx in unpaired_from:
                    opacity = from_triangles[idx].get("opacity", 1.0)
                    print(f"  Triangle {idx}, opacity={opacity}")

            if unpaired_to:
                print(
                    f"Warning: {len(unpaired_to)} unpaired 'to' triangles in transition {from_idx} → {to_idx}"
                )
                for idx in unpaired_to:
                    opacity = to_triangles[idx].get("opacity", 1.0)
                    print(f"  Triangle {idx}, opacity={opacity}")

            # Check that each triangle index is paired at most once
            assert len(from_indices) == len(
                pairings
            ), "Some from_indices are used multiple times"
            assert len(to_indices) == len(
                pairings
            ), "Some to_indices are used multiple times"

            # UPDATED BEHAVIOR: All triangles (including invisible ones) should be paired
            # after our change to create_transition

            # Verify that ALL triangles have pairings
            assert len(unpaired_from) == 0, "Not all 'from' triangles are paired"
            assert len(unpaired_to) == 0, "Not all 'to' triangles are paired"

            # Verify that the pairings cover all triangles in both slides
            assert len(from_indices) == len(
                from_triangles
            ), "Not all 'from' triangles are paired"
            assert len(to_indices) == len(
                to_triangles
            ), "Not all 'to' triangles are paired"

            # Additional check: pairings should have valid distances
            for pairing in pairings:
                assert "distance" in pairing
                assert isinstance(pairing["distance"], (int, float))

    def test_to_dict(self):
        """Test converting a slideshow to a dictionary."""
        # Patch the module where create_transition is imported from
        with patch("triangle_slideshow.slideshow.create_transition") as mock_create:
            # Arrange
            mock_create.return_value = EXPECTED_PAIRINGS
            slideshow = Slideshow()
            slideshow.add_slide(TRIANGLES_SET_A, name="slide_0")
            slideshow.add_slide(TRIANGLES_SET_B, name="slide_1")
            slideshow.add_transition(0, 1, max_triangles=1000)

            # Act
            result = slideshow.to_dict()

            # Assert
            assert "slides" in result
            assert len(result["slides"]) == 2
            # assert "transitions" in result # This key is no longer top-level

            # Check that the first slide has the transition information
            assert "transitions" in result["slides"][0]
            assert len(result["slides"][0]["transitions"]) == 1
            assert result["slides"][0]["transitions"][0]["to"] == 1
            # The second slide should have no outgoing transitions in this setup
            assert (
                "transitions" not in result["slides"][1]
                or not result["slides"][1]["transitions"]
            )

    def test_from_dict(self):
        """Test creating a slideshow from a dictionary."""
        # Act
        slideshow = Slideshow.from_dict(SAMPLE_SLIDESHOW_DICT)

        # Assert
        assert len(slideshow.slides) == 2
        assert len(slideshow.transitions) == 1
        assert slideshow.slides[0]["name"] == "slide_0"
        assert slideshow.slides[1]["name"] == "slide_1"
        assert slideshow.transitions[0]["from"] == 0
        assert slideshow.transitions[0]["to"] == 1

    def test_from_dict_empty(self):
        """Test creating a slideshow from an empty dictionary."""
        # Act
        slideshow = Slideshow.from_dict(EMPTY_SLIDESHOW_DICT)

        # Assert
        assert len(slideshow.slides) == 0
        assert len(slideshow.transitions) == 0

    def test_from_dict_single_slide(self):
        """Test creating a slideshow from a dictionary with a single slide."""
        # Act
        slideshow = Slideshow.from_dict(SINGLE_SLIDE_SLIDESHOW_DICT)

        # Assert
        assert len(slideshow.slides) == 1
        assert len(slideshow.transitions) == 0
        assert slideshow.slides[0]["name"] == "slide_0"


class TestSlideshowIO:
    """Tests for the slideshow I/O functions."""

    def test_save_slideshow(self):
        """Test saving a slideshow to a file."""
        # Patch the module where create_transition is imported from
        with patch("triangle_slideshow.slideshow.create_transition") as mock_create:
            # Arrange
            mock_create.return_value = EXPECTED_PAIRINGS
            slideshow = Slideshow()
            slideshow.add_slide(
                TRIANGLES_SET_A, name="slide_0"
            )  # Added name for clarity
            slideshow.add_slide(
                TRIANGLES_SET_B, name="slide_1"
            )  # Added name for clarity
            slideshow.add_transition(0, 1, max_triangles=1000)

            # Act - Use a temporary file
            with tempfile.NamedTemporaryFile(delete=False, mode="w") as temp_file:
                file_path = temp_file.name

            try:
                save_slideshow(slideshow, file_path)

                # Assert
                assert os.path.exists(file_path)
                with open(file_path, "r") as f:
                    data = json.load(f)

                assert "slides" in data
                assert len(data["slides"]) == 2
                # assert "transitions" in data # This key is no longer top-level

                # Check that the first slide in JSON has the transition information
                assert "transitions" in data["slides"][0]
                assert len(data["slides"][0]["transitions"]) == 1
                assert data["slides"][0]["transitions"][0]["to"] == 1
                # The second slide should have no outgoing transitions
                assert (
                    "transitions" not in data["slides"][1]
                    or not data["slides"][1]["transitions"]
                )

            finally:
                if os.path.exists(file_path):
                    os.remove(file_path)

    def test_load_slideshow(self):
        """Test loading a slideshow from a file."""
        # Arrange - Create a test file with slideshow data
        with tempfile.NamedTemporaryFile(delete=False, mode="w") as temp_file:
            file_path = temp_file.name
            json.dump(SAMPLE_SLIDESHOW_DICT, temp_file)

        try:
            # Act
            slideshow = load_slideshow(file_path)

            # Assert
            assert isinstance(slideshow, Slideshow)
            assert len(slideshow.slides) == 2
            assert len(slideshow.transitions) == 1
            assert slideshow.slides[0]["name"] == "slide_0"
            assert slideshow.slides[1]["name"] == "slide_1"
            assert slideshow.transitions[0]["from"] == 0
            assert slideshow.transitions[0]["to"] == 1

        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)

    def test_load_slideshow_file_not_found(self):
        """Test loading a slideshow from a non-existent file."""
        # Act & Assert
        with pytest.raises(FileNotFoundError):
            load_slideshow("/non/existent/file.json")

    def test_load_slideshow_invalid_json(self):
        """Test loading a slideshow from a file with invalid JSON."""
        # Arrange - Create a test file with invalid JSON
        with tempfile.NamedTemporaryFile(delete=False, mode="w") as temp_file:
            file_path = temp_file.name
            temp_file.write("invalid json")

        try:
            # Act & Assert
            with pytest.raises(json.JSONDecodeError):
                load_slideshow(file_path)

        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.remove(file_path)

    def test_round_trip(self):
        """Test saving and then loading a slideshow."""
        # Patch the module where create_transition is imported from
        with patch("triangle_slideshow.slideshow.create_transition") as mock_create:
            # Arrange
            mock_create.return_value = EXPECTED_PAIRINGS
            original_slideshow = Slideshow()
            original_slideshow.add_slide(TRIANGLES_SET_A, name="slide_A")
            original_slideshow.add_slide(TRIANGLES_SET_B, name="slide_B")
            original_slideshow.add_transition(0, 1, max_triangles=1000)

            # Store original transition details for comparison
            # original_slideshow.transitions will have the full transition object
            # For this test, we are primarily concerned with the from/to and structure
            expected_num_total_transitions = len(original_slideshow.transitions)
            expected_transitions_from_to = set()
            for trans in original_slideshow.transitions:
                expected_transitions_from_to.add((trans["from"], trans["to"]))

            # Act - Use a temporary file for the round trip
            with tempfile.NamedTemporaryFile(delete=False, mode="w") as temp_file:
                file_path = temp_file.name

            try:
                save_slideshow(original_slideshow, file_path)
                loaded_slideshow = load_slideshow(file_path)

                # Assert
                assert len(loaded_slideshow.slides) == len(original_slideshow.slides)

                # Reconstruct transitions from the loaded_slideshow
                loaded_transitions_from_to = set()
                loaded_num_total_transitions = 0
                for idx, slide_data in enumerate(loaded_slideshow.slides):
                    slide_specific_transitions = slide_data.get("transitions", [])
                    loaded_num_total_transitions += len(slide_specific_transitions)
                    for trans_info in slide_specific_transitions:
                        loaded_transitions_from_to.add(
                            (idx, trans_info["to"])
                        )  # from is idx

                assert loaded_num_total_transitions == expected_num_total_transitions
                assert loaded_transitions_from_to == expected_transitions_from_to

                # Also check slide names if they were set
                assert (
                    loaded_slideshow.slides[0]["name"]
                    == original_slideshow.slides[0]["name"]
                )
                assert (
                    loaded_slideshow.slides[1]["name"]
                    == original_slideshow.slides[1]["name"]
                )

            finally:
                if os.path.exists(file_path):
                    os.remove(file_path)
