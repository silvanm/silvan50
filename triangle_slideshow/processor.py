"""
Processor module for triangle slideshow.

This module handles processing images into triangle representations using triangler.
"""

import os
import json
import glob
import sys
from pathlib import Path

# Add triangler_dir to the Python path if it exists
TRIANGLER_DIR = os.path.abspath("triangler_dir")
if os.path.isdir(TRIANGLER_DIR):
    sys.path.insert(0, TRIANGLER_DIR)

import triangler
from triangler import TrianglerConfig, EdgeDetector, Sampler, Renderer


def process_image(image_path, output_path=None, num_points=1000):
    """
    Process a single image into triangles using the triangler module.

    Args:
        image_path (str): Path to the input image
        output_path (str, optional): Path for output JSON file
        num_points (int): Number of points for triangulation

    Returns:
        list: List of triangles if successful, None otherwise
    """
    try:
        image_path = Path(image_path).absolute()

        # If output_path is not specified, create one based on input path
        if not output_path:
            output_path = image_path.with_suffix(".json")
        else:
            output_path = Path(output_path).absolute()

        print(f"Processing {image_path} with {num_points} points...")

        # Create configuration
        config = TrianglerConfig(
            n_samples=num_points,
            edge_detector=EdgeDetector.SOBEL,
            sampler=Sampler.POISSON_DISK,
            renderer=Renderer.CENTROID,
        )

        # Use triangler directly
        triangler.convert(
            img=str(image_path),
            output_path=str(output_path),
            output_format="json",
            config=config,
        )

        # Load the resulting triangles to return them
        with open(output_path, "r") as f:
            triangles = json.load(f)

        print(f"Generated {len(triangles)} triangles from {image_path}")
        return triangles

    except Exception as e:
        print(f"Error processing image {image_path}: {e}", file=sys.stderr)
        return None


def process_images(
    input_dir, output_dir=None, num_points=1000, extensions=("jpg", "jpeg", "png")
):
    """
    Process all images in a directory into triangle representations.

    Args:
        input_dir (str): Directory containing images
        output_dir (str, optional): Directory for output JSON files
        num_points (int): Number of points for triangulation
        extensions (tuple): Image file extensions to process

    Returns:
        dict: Dictionary mapping output filenames to list of triangles
    """
    input_dir = Path(input_dir).absolute()

    # If output_dir is not specified, create a subdirectory in the input directory
    if not output_dir:
        output_dir = input_dir / "triangles"

    output_dir = Path(output_dir).absolute()
    os.makedirs(output_dir, exist_ok=True)

    # Find all image files
    image_files = []
    for ext in extensions:
        image_files.extend(glob.glob(str(input_dir / f"*.{ext.lower()}")))
        image_files.extend(glob.glob(str(input_dir / f"*.{ext.upper()}")))

    if not image_files:
        print(f"No image files found in {input_dir} with extensions: {extensions}")
        return {}

    print(f"Found {len(image_files)} image files to process")

    # Process each image
    results = {}
    for image_file in image_files:
        image_path = Path(image_file)
        output_filename = image_path.stem + ".json"
        output_path = output_dir / output_filename

        triangles = process_image(image_file, output_path, num_points)
        if triangles is not None:
            results[output_filename] = triangles

    print(f"Successfully processed {len(results)} out of {len(image_files)} images")
    return results
