"""
End-to-end tests for the triangle slideshow package.

This module tests the integration of processor.py, slideshow.py, and transition.py.
"""

import os
import tempfile
import json
from unittest.mock import patch, MagicMock
import pytest

from triangle_slideshow.processor import process_image, process_images
from triangle_slideshow.slideshow import Slideshow, save_slideshow, load_slideshow
from triangle_slideshow.transition import create_transition

from tests.test_triangle_slideshow.fixtures import (
    TRIANGLES_SET_A,
    TRIANGLES_SET_B,
    TRIANGLES_SET_C,
    EXPECTED_PAIRINGS,
)


class TestEndToEnd:
    """End-to-end tests for the triangle slideshow package."""

    def test_full_process_flow(self):
        """Test the entire process from image processing to slideshow creation and serialization."""
        # Create a temporary directory for our test
        with tempfile.TemporaryDirectory() as temp_dir:
            # Mock the triangler.convert function to generate our triangle sets
            with patch("triangle_slideshow.processor.triangler") as mock_triangler:
                # Setup the mock to write our predefined triangle sets to the output files
                def mock_convert(img, output_path, output_format, config):
                    # Determine which triangle set to use based on the image path
                    if "image_0" in img:
                        triangles = TRIANGLES_SET_A
                    elif "image_1" in img:
                        triangles = TRIANGLES_SET_B
                    elif "image_2" in img:
                        triangles = TRIANGLES_SET_C
                    else:
                        triangles = []

                    # Write the triangles to the output file
                    with open(output_path, "w") as f:
                        json.dump(triangles, f)

                # Assign our implementation
                mock_triangler.convert.side_effect = mock_convert

                # Create fake image paths
                image_paths = [
                    os.path.join(temp_dir, f"image_{i}.jpg") for i in range(3)
                ]

                # Create output paths
                output_paths = [
                    os.path.join(temp_dir, f"image_{i}.json") for i in range(3)
                ]

                # Process each "image"
                processed_triangles = []
                for i, image_path in enumerate(image_paths):
                    # Touch the image file to create it
                    with open(image_path, "w") as f:
                        f.write("fake image data")

                    # Process the image in test mode
                    triangles = process_image(
                        image_path, output_paths[i], num_points=1000, testing=True
                    )
                    processed_triangles.append(triangles)

                # Verify we got the expected triangle sets
                assert len(processed_triangles) == 3
                assert len(processed_triangles[0]["triangles"]) == len(TRIANGLES_SET_A)
                assert processed_triangles[0]["triangles"] == TRIANGLES_SET_A
                assert len(processed_triangles[1]["triangles"]) == len(TRIANGLES_SET_B)
                assert processed_triangles[1]["triangles"] == TRIANGLES_SET_B
                assert len(processed_triangles[2]["triangles"]) == len(TRIANGLES_SET_C)
                assert processed_triangles[2]["triangles"] == TRIANGLES_SET_C

                # Step 2: Create a slideshow from the processed triangles
                slideshow = Slideshow()

                # Add each triangle set as a slide
                for i, triangles in enumerate(processed_triangles):
                    slideshow.add_slide(triangles, name=f"slide_{i}")

                # Step 3: Create transitions between slides using round-robin pattern
                with patch(
                    "triangle_slideshow.slideshow.create_transition"
                ) as mock_create_transition:
                    # Mock create_transition to return our expected pairings
                    mock_create_transition.return_value = EXPECTED_PAIRINGS

                    # Create round-robin transitions
                    num_transitions = slideshow.round_robin_transitions(
                        max_triangles=1000
                    )

                    # Verify we created the expected number of transitions
                    assert num_transitions == 3
                    assert len(slideshow.transitions) == 3

                    # Verify the transition structure (round-robin: 0->1, 1->2, 2->0)
                    transitions = [(t["from"], t["to"]) for t in slideshow.transitions]
                    assert (0, 1) in transitions
                    assert (1, 2) in transitions
                    assert (2, 0) in transitions

                # Step 4: Save the slideshow to a file and then load it back
                output_path = os.path.join(temp_dir, "slideshow.json")

                # Save the slideshow
                saved_path = save_slideshow(slideshow, output_path)

                # Verify the file exists
                assert os.path.exists(saved_path)

                # Load the saved slideshow
                loaded_slideshow = load_slideshow(saved_path)

                # Verify the loaded slideshow has the expected structure
                assert len(loaded_slideshow.slides) == 3

                # Reconstruct transitions from the loaded slide data
                actual_loaded_transitions = []
                for idx, slide_data in enumerate(loaded_slideshow.slides):
                    for trans_info in slide_data.get("transitions", []):
                        actual_loaded_transitions.append((idx, trans_info["to"]))
                assert len(actual_loaded_transitions) == 3  # Expect 3 transitions total

                # Verify slide names are preserved
                for i in range(3):
                    assert loaded_slideshow.slides[i]["name"] == f"slide_{i}"

                # Verify the transition pattern is preserved
                # Original transitions were (0,1), (1,2), (2,0)
                assert (0, 1) in actual_loaded_transitions
                assert (1, 2) in actual_loaded_transitions
                assert (2, 0) in actual_loaded_transitions

    def test_error_handling(self):
        """Test error handling in the end-to-end process."""
        # Mock triangler to raise an exception during processing
        with patch("triangle_slideshow.processor.triangler") as mock_triangler:
            # Setup mock to simulate triangler failure
            mock_triangler.convert.side_effect = Exception(
                "Triangler processing failed"
            )

            # Create a temp directory
            with tempfile.TemporaryDirectory() as temp_dir:
                # Create a fake image path
                image_path = os.path.join(temp_dir, "invalid_image.jpg")

                # Attempt to process the image, should handle the exception
                result = process_image(image_path, num_points=1000, testing=True)

                # Verify we got None as the result due to error handling
                assert result is None

    def test_process_multiple_images(self):
        """Test processing multiple images at once and creating a slideshow from them."""
        # Create a temporary directory for our test
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create a subdirectory for input images
            input_dir = os.path.join(temp_dir, "input")
            os.makedirs(input_dir, exist_ok=True)

            # Create output directory
            output_dir = os.path.join(temp_dir, "output")
            os.makedirs(output_dir, exist_ok=True)

            # Create fake image files
            for i in range(3):
                image_path = os.path.join(input_dir, f"image_{i}.jpg")
                with open(image_path, "w") as f:
                    f.write("fake image data")

            # Mock the triangler.convert function
            with patch("triangle_slideshow.processor.triangler") as mock_triangler:
                # Setup the mock to write our triangle sets to output files
                def mock_convert(img, output_path, output_format, config):
                    # Determine which triangle set to use based on image path
                    if "image_0" in img:
                        triangles = TRIANGLES_SET_A
                    elif "image_1" in img:
                        triangles = TRIANGLES_SET_B
                    elif "image_2" in img:
                        triangles = TRIANGLES_SET_C
                    else:
                        triangles = []

                    # Write triangles to the output file
                    with open(output_path, "w") as f:
                        json.dump(triangles, f)

                # Assign our implementation
                mock_triangler.convert.side_effect = mock_convert

                # Process all images in the directory in test mode
                results = process_images(
                    input_dir, output_dir, num_points=1000, testing=True
                )

                # Verify we got the expected results
                assert len(results) == 3

                # Check that each image was processed correctly
                for i, triangles_list in enumerate(
                    [TRIANGLES_SET_A, TRIANGLES_SET_B, TRIANGLES_SET_C]
                ):
                    # Construct the key as it appears in the results dictionary (filename)
                    # Assuming images are named image_0.jpg, image_1.jpg, etc.
                    # and process_images returns keys like "image_0.json"
                    # The mock_convert saves image_0.json, image_1.json etc.
                    # The results from process_images uses these as keys.

                    output_filename = (
                        f"image_{i}.json"  # This matches the mocked output file name
                    )
                    assert output_filename in results
                    assert len(results[output_filename]["triangles"]) == len(
                        triangles_list
                    )
                    assert results[output_filename]["triangles"] == triangles_list
                    # Also check dominant_colors if it's consistent from the mock (it's a placeholder)
                    assert (
                        results[output_filename]["dominant_colors"] == ["#FFFFFF"] * 5
                    )

                # Create a slideshow from the results
                slideshow = Slideshow()
                for output_filename, triangles in results.items():
                    slideshow.add_slide(triangles, name=output_filename)

                # Create round-robin transitions
                with patch(
                    "triangle_slideshow.slideshow.create_transition"
                ) as mock_create_transition:
                    # Mock create_transition to return our expected pairings
                    mock_create_transition.return_value = EXPECTED_PAIRINGS

                    # Create the transitions
                    num_transitions = slideshow.round_robin_transitions()

                    # Verify the transition structure
                    assert num_transitions == 3
                    assert len(slideshow.transitions) == 3

                    # Check for the round-robin pattern
                    transitions = set(
                        (t["from"], t["to"]) for t in slideshow.transitions
                    )
                    assert transitions == {(0, 1), (1, 2), (2, 0)}

    def test_round_robin_slideshow_creation(self):
        """Test creating a slideshow with round-robin transitions and exporting to JSON."""
        # Create a slideshow with our test triangle sets
        slideshow = Slideshow()

        # Add three slides with different triangle sets
        slideshow.add_slide(TRIANGLES_SET_A, name="slide_A")
        slideshow.add_slide(TRIANGLES_SET_B, name="slide_B")
        slideshow.add_slide(TRIANGLES_SET_C, name="slide_C")

        # Patch create_transition to return our expected pairings
        with patch(
            "triangle_slideshow.slideshow.create_transition"
        ) as mock_create_transition:
            mock_create_transition.return_value = EXPECTED_PAIRINGS

            # Create round-robin transitions
            num_transitions = slideshow.round_robin_transitions(max_triangles=500)

            # Verify we created the expected number of transitions
            assert num_transitions == 3
            assert len(slideshow.transitions) == 3

            # Check the transition structure
            transitions = [(t["from"], t["to"]) for t in slideshow.transitions]
            assert (0, 1) in transitions  # A -> B
            assert (1, 2) in transitions  # B -> C
            assert (2, 0) in transitions  # C -> A

            # Create a temporary file for the output
            with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as temp_file:
                output_path = temp_file.name

            try:
                # Save the slideshow to the file
                save_slideshow(slideshow, output_path)

                # Load it back
                loaded_slideshow = load_slideshow(output_path)

                # Verify the loaded slideshow has the same structure
                assert len(loaded_slideshow.slides) == 3

                # Reconstruct and verify transitions from loaded slide data
                actual_loaded_transitions_tuples = []
                total_transitions_count = 0
                for idx, slide_data in enumerate(loaded_slideshow.slides):
                    slide_transitions = slide_data.get("transitions", [])
                    total_transitions_count += len(slide_transitions)
                    for trans_info in slide_transitions:
                        actual_loaded_transitions_tuples.append((idx, trans_info["to"]))

                assert total_transitions_count == 3  # Expect 3 transitions in total

                # Verify slide names are preserved
                assert loaded_slideshow.slides[0]["name"] == "slide_A"
                assert loaded_slideshow.slides[1]["name"] == "slide_B"
                assert loaded_slideshow.slides[2]["name"] == "slide_C"

                # Verify transitions are preserved (A->B is 0->1, B->C is 1->2, C->A is 2->0)
                assert (0, 1) in actual_loaded_transitions_tuples  # A -> B
                assert (1, 2) in actual_loaded_transitions_tuples  # B -> C
                assert (2, 0) in actual_loaded_transitions_tuples  # C -> A

                # Also verify the JSON structure directly
                with open(output_path, "r") as f:
                    json_data = json.load(f)

                # Check top-level structure
                assert "slides" in json_data
                # assert "transitions" in json_data # This key is no longer top-level
                assert len(json_data["slides"]) == 3
                # assert len(json_data["transitions"]) == 3 # This key is no longer top-level

                # Check round-robin transition pattern in JSON (within each slide)
                # Slide 0 (A) should transition to slide 1 (B)
                assert len(json_data["slides"][0].get("transitions", [])) == 1
                assert json_data["slides"][0]["transitions"][0]["to"] == 1
                # Slide 1 (B) should transition to slide 2 (C)
                assert len(json_data["slides"][1].get("transitions", [])) == 1
                assert json_data["slides"][1]["transitions"][0]["to"] == 2
                # Slide 2 (C) should transition to slide 0 (A)
                assert len(json_data["slides"][2].get("transitions", [])) == 1
                assert json_data["slides"][2]["transitions"][0]["to"] == 0

            finally:
                # Clean up temp file
                if os.path.exists(output_path):
                    os.remove(output_path)
