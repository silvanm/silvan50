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

    def add_slide(self, triangles, name=None):
        """
        Add a slide to the slideshow.

        Args:
            triangles (list): List of triangles for the slide
            name (str, optional): Name for the slide

        Returns:
            int: Index of the added slide
        """
        slide_index = len(self.slides)
        slide = {"triangles": triangles, "name": name or f"slide_{slide_index}"}
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

    def to_dict(self):
        """
        Convert the slideshow to a dictionary for serialization.

        Returns:
            dict: Dictionary representation of the slideshow
        """
        return {"slides": self.slides, "transitions": self.transitions}

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
