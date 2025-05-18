"""
Slideshow module for triangle slideshow.

This module handles the slideshow data structure and serialization.
"""

import json
import os
from pathlib import Path
from triangle_slideshow.transition import create_transition


class Slideshow:
    """Class representing a triangle slideshow with multiple slides and transitions."""

    def __init__(self):
        """Initialize an empty slideshow."""
        self.slides = []
        self.transitions = []

    def add_slide(self, triangles_data, name=None, image_path=None):
        """
        Add a slide to the slideshow.

        Args:
            triangles_data (dict/list): List of triangles or dict with triangles and dominant_colors
            name (str, optional): Name for the slide
            image_path (str, optional): Path to the original image file

        Returns:
            int: Index of the added slide
        """
        slide_index = len(self.slides)

        # Check if triangles_data is a dict with both triangles and dominant_colors
        if isinstance(triangles_data, dict) and "triangles" in triangles_data:
            slide = {
                "triangles": triangles_data["triangles"],
                "name": name or f"slide_{slide_index}",
            }

            # Add dominant colors if available
            if "dominant_colors" in triangles_data:
                slide["dominant_colors"] = triangles_data["dominant_colors"]
        else:
            # Legacy format - just a list of triangles
            slide = {
                "triangles": triangles_data,
                "name": name or f"slide_{slide_index}",
            }

        # Add image path if provided
        if image_path:
            slide["image_path"] = image_path

        self.slides.append(slide)
        return slide_index

    def add_transition(self, from_index, to_index, max_triangles=None):
        """
        Add a transition between two slides.

        Args:
            from_index (int): Index of the source slide
            to_index (int): Index of the target slide
            max_triangles (int, optional): Maximum number of triangles to use

        Returns:
            dict: The created transition
        """
        # Ensure slides exist
        if from_index >= len(self.slides) or to_index >= len(self.slides):
            raise ValueError("Slide indices out of range")

        # Create transition pairings
        pairings = create_transition(
            self.slides[from_index]["triangles"],
            self.slides[to_index]["triangles"],
            max_triangles,
        )

        # Create transition object
        transition = {"from": from_index, "to": to_index, "pairings": pairings}

        self.transitions.append(transition)
        return transition

    def auto_create_transitions(self, max_triangles=None, sequential_only=True):
        """
        Automatically create transitions between slides.

        Args:
            max_triangles (int, optional): Maximum number of triangles to use
            sequential_only (bool): If True, only create transitions between consecutive slides

        Returns:
            int: Number of transitions created
        """
        if len(self.slides) < 2:
            return 0

        count = 0
        if sequential_only:
            # Only create transitions between consecutive slides
            for i in range(len(self.slides) - 1):
                self.add_transition(i, i + 1, max_triangles)
                count += 1
        else:
            # Create transitions between all pairs of slides
            for i in range(len(self.slides)):
                for j in range(i + 1, len(self.slides)):
                    self.add_transition(i, j, max_triangles)
                    count += 1

        return count

    def round_robin_transitions(self, max_triangles=None):
        """
        Create round-robin transitions between slides (1-2-3-1).

        This creates transitions between consecutive slides and adds a final
        transition from the last slide back to the first slide to complete the cycle.

        Args:
            max_triangles (int, optional): Maximum number of triangles to use

        Returns:
            int: Number of transitions created
        """
        if len(self.slides) < 2:
            return 0

        # Create transitions between consecutive slides
        count = self.auto_create_transitions(max_triangles, sequential_only=True)

        # Add the final transition from last slide back to first
        self.add_transition(len(self.slides) - 1, 0, max_triangles)
        count += 1

        return count

    def standardize_triangle_counts(self):
        """
        Ensure all slides have the same number of triangles by adding dummy triangles.

        Dummy triangles are added with opacity=0 to slides with fewer triangles
        than the maximum count. Positions for dummy triangles are taken from adjacent slides.

        Returns:
            int: Number of dummy triangles added
        """
        if len(self.slides) < 2:
            return 0

        # Find the maximum number of triangles in any slide
        max_triangle_count = max(len(slide["triangles"]) for slide in self.slides)

        # Keep track of how many dummy triangles we add
        total_added = 0

        # Process each slide
        for slide_idx, slide in enumerate(self.slides):
            current_triangles = slide["triangles"]
            triangles_needed = max_triangle_count - len(current_triangles)

            if triangles_needed <= 0:
                continue  # This slide already has enough triangles

            # Add dummy triangles to this slide
            for _ in range(triangles_needed):
                # Create a dummy triangle by finding a position from an adjacent slide
                dummy_triangle = self._create_dummy_triangle(
                    slide_idx, len(current_triangles) + total_added
                )
                current_triangles.append(dummy_triangle)
                total_added += 1

        return total_added

    def _create_dummy_triangle(self, slide_idx, triangle_idx):
        """
        Create a dummy triangle for a specific slide.

        The position is copied from another slide, preferring adjacent slides.

        Args:
            slide_idx (int): Index of the slide needing a dummy triangle
            triangle_idx (int): Index where the triangle will be placed

        Returns:
            dict: A dummy triangle with opacity=0
        """
        slides_count = len(self.slides)

        # Find adjacent slide indices, with wraparound for first/last slides
        prev_idx = (slide_idx - 1) % slides_count
        next_idx = (slide_idx + 1) % slides_count

        # First, try to directly copy from the same position in the next slide
        next_triangles = self.slides[next_idx]["triangles"]
        if triangle_idx < len(next_triangles):
            src_triangle = next_triangles[triangle_idx]
            return {
                "coordinates": src_triangle["coordinates"].copy(),
                "color": src_triangle["color"].copy(),
                "opacity": 0.0,  # Make the dummy triangle invisible
            }

        # If not available in the next slide, try the previous slide
        prev_triangles = self.slides[prev_idx]["triangles"]
        if triangle_idx < len(prev_triangles):
            src_triangle = prev_triangles[triangle_idx]
            return {
                "coordinates": src_triangle["coordinates"].copy(),
                "color": src_triangle["color"].copy(),
                "opacity": 0.0,
            }

        # If the exact position isn't available in adjacent slides,
        # look for any slide that has this position
        for offset in range(1, slides_count):
            check_idx = (slide_idx + offset) % slides_count
            check_triangles = self.slides[check_idx]["triangles"]

            if triangle_idx < len(check_triangles):
                src_triangle = check_triangles[triangle_idx]
                return {
                    "coordinates": src_triangle["coordinates"].copy(),
                    "color": src_triangle["color"].copy(),
                    "opacity": 0.0,
                }

        # If no slide has a triangle at this exact position,
        # fall back to using the first available triangle from any slide
        for idx in range(slides_count):
            if idx == slide_idx:
                continue  # Skip the current slide

            check_triangles = self.slides[idx]["triangles"]
            if check_triangles:
                # Use the first triangle
                src_triangle = check_triangles[0]
                return {
                    "coordinates": src_triangle["coordinates"].copy(),
                    "color": src_triangle["color"].copy(),
                    "opacity": 0.0,
                }

        # Last resort fallback: create a default triangle
        return {
            "coordinates": [[0, 0], [10, 0], [5, 10]],
            "color": [0, 255, 0],  # Green color for dummy triangles
            "opacity": 0.0,
        }

    def to_dict(self):
        """
        Convert the slideshow to a dictionary representation.

        Returns:
            dict: Dictionary representation of the slideshow
        """
        slides_dict = []
        for i, slide in enumerate(self.slides):
            slide_dict = {
                "index": i,
                "name": slide["name"],
                "filename": f"slide_{i}.json",
            }

            # Include dominant_colors if available
            if "dominant_colors" in slide:
                slide_dict["dominant_colors"] = slide["dominant_colors"]

            # Add transitions from this slide
            transitions = [
                {"to": t["to"], "filename": f"transition_{i}_to_{t['to']}.json"}
                for t in self.transitions
                if t["from"] == i
            ]
            if transitions:
                slide_dict["transitions"] = transitions

            slides_dict.append(slide_dict)

        return {"total_slides": len(self.slides), "slides": slides_dict}

    def export_individual_slides(self, output_dir):
        """
        Export all slides to individual files and return manifest data.

        Args:
            output_dir (Path): Directory to write the files

        Returns:
            dict: Manifest data with references to all slide and transition files
        """
        # Create list to hold slide data
        slides_manifest = []

        # Create directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Export each slide
        for idx, slide in enumerate(self.slides):
            slide_filename = f"slide_{idx}.json"
            slide_path = output_dir / slide_filename

            # Map of transitions for this slide
            slide_transitions = []

            # Find all transitions starting from this slide
            for transition in self.transitions:
                if transition["from"] == idx:
                    transition_filename = (
                        f"transition_{transition['from']}_to_{transition['to']}.json"
                    )
                    transition_path = output_dir / transition_filename

                    # Write transition file (just the pairings array)
                    with open(transition_path, "w") as f:
                        json.dump(transition["pairings"], f)

                    # Add to slide transitions
                    slide_transitions.append(
                        {"to": transition["to"], "filename": transition_filename}
                    )

            # Write slide file
            with open(slide_path, "w") as f:
                json.dump(slide, f)

            # Add to manifest
            slide_manifest = {
                "index": idx,
                "name": slide.get("name", f"slide_{idx}"),
                "filename": slide_filename,
                "transitions": slide_transitions,
            }

            # Add dominant colors if available
            if "dominant_colors" in slide:
                slide_manifest["dominant_colors"] = slide["dominant_colors"]

            # Add image path if available
            if "image_path" in slide:
                slide_manifest["image_path"] = slide["image_path"]

            slides_manifest.append(slide_manifest)

        # Create manifest
        manifest = {
            "total_slides": len(self.slides),
            "slides": slides_manifest,
        }

        return manifest

    @classmethod
    def from_dict(cls, data):
        """
        Create a slideshow from a dictionary.

        Args:
            data (dict): Dictionary representation of a slideshow

        Returns:
            Slideshow: The created slideshow
        """
        slideshow = cls()
        slideshow.slides = data.get("slides", [])
        slideshow.transitions = data.get("transitions", [])
        return slideshow


def save_slideshow(slideshow, output_path):
    """
    Save a slideshow to a JSON file.

    Args:
        slideshow (Slideshow): The slideshow to save
        output_path (str): Path to the output file

    Returns:
        str: Path to the saved file
    """
    output_path = Path(output_path)
    os.makedirs(output_path.parent, exist_ok=True)

    data = slideshow.to_dict()

    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Slideshow saved to {output_path}")
    return str(output_path)


def save_slideshow_split(slideshow, output_dir):
    """
    Save a slideshow as a manifest and multiple JSON files.

    Args:
        slideshow (Slideshow): The slideshow to save
        output_dir (str): Directory to save the files

    Returns:
        Path: Path to the manifest.json file
    """
    output_dir = Path(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    manifest = slideshow.export_individual_slides(output_dir)

    # Write the manifest to a file
    manifest_path = output_dir / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    return manifest_path


def load_slideshow(input_path):
    """
    Load a slideshow from a JSON file.

    Args:
        input_path (str): Path to the input file

    Returns:
        Slideshow: The loaded slideshow
    """
    with open(input_path, "r") as f:
        data = json.load(f)

    return Slideshow.from_dict(data)
