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
import numpy as np
from skimage.io import imread, imsave
from skimage.transform import resize
from .color_analyzer import extract_dominant_colors


def crop_to_square(image):
    """
    Crop an image to make it square using the center as the focal point.

    Args:
        image (numpy.ndarray): Input image array

    Returns:
        numpy.ndarray: Square cropped image
    """
    height, width = image.shape[:2]

    # Determine the size of the square (use the smaller dimension)
    size = min(height, width)

    # Calculate cropping parameters to center the crop
    top = (height - size) // 2
    left = (width - size) // 2

    # Crop the image to a square
    cropped_image = image[top : top + size, left : left + size]

    return cropped_image


def process_image(
    image_path, output_path=None, num_points=1000, square_size=None, testing=False
):
    """
    Process a single image into triangles using the triangler module.

    Args:
        image_path (str): Path to the input image
        output_path (str, optional): Path for output JSON file
        num_points (int): Number of points for triangulation
        square_size (int, optional): Size of the square crop (if None, uses the min dimension)
        testing (bool): If True, skip the actual image processing (for tests)

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

        # Extract dominant colors from the original image
        dominant_colors = extract_dominant_colors(str(image_path))
        print(f"Extracted dominant colors: {dominant_colors}")

        # Skip image processing in test mode
        temp_image_path = str(image_path)
        if not testing:
            try:
                # Load the image
                image = imread(str(image_path))

                # Rotate image 90° counterclockwise
                # (Equivalent to np.rot90(image, k=1))
                image = np.transpose(
                    image, axes=(1, 0, 2) if image.ndim == 3 else (1, 0)
                )
                if image.ndim == 3:  # Color image
                    image = image[::-1, :, :]
                else:  # Grayscale image
                    image = image[::-1, :]

                print(f"Rotated image 90° counterclockwise")

                # Crop to square
                square_image = crop_to_square(image)

                # Resize to specific dimensions if requested
                if square_size is not None:
                    square_image = resize(
                        square_image, (square_size, square_size), preserve_range=True
                    ).astype(image.dtype)

                print(f"Cropped image to square: {square_image.shape[:2]}")

                # Save the cropped image to a temporary file
                temp_image_path = str(
                    image_path.parent / f"temp_square_{image_path.name}"
                )
                imsave(temp_image_path, square_image)
            except Exception as e:
                if testing:
                    # In test mode, just continue with the original path
                    print(f"Skipping image processing in test mode: {e}")
                else:
                    # In normal mode, propagate the error
                    raise

        # Create configuration
        config = TrianglerConfig(
            n_samples=num_points,
            edge_detector=EdgeDetector.SOBEL,
            sampler=Sampler.POISSON_DISK,
            renderer=Renderer.CENTROID,
        )

        # Use triangler directly with the square image
        triangler.convert(
            img=temp_image_path,
            output_path=str(output_path),
            output_format="json",
            config=config,
        )

        # Clean up temporary file if we created one
        if temp_image_path != str(image_path) and os.path.exists(temp_image_path):
            os.remove(temp_image_path)

        # Load the resulting triangles to return them
        with open(output_path, "r") as f:
            triangles = json.load(f)

        # Add dominant colors to the triangles data
        triangles_with_colors = {
            "triangles": triangles,
            "dominant_colors": dominant_colors,
        }

        # Save the updated triangles with colors
        with open(output_path, "w") as f:
            json.dump(triangles_with_colors, f)

        print(f"Generated {len(triangles)} triangles from {image_path}")
        return triangles_with_colors

    except Exception as e:
        print(f"Error processing image {image_path}: {e}", file=sys.stderr)
        return None


def process_images(
    input_dir,
    output_dir=None,
    num_points=1000,
    extensions=("jpg", "jpeg", "png"),
    square_size=1080,
    testing=False,
):
    """
    Process all images in a directory into triangle representations.

    Args:
        input_dir (str): Directory containing images
        output_dir (str, optional): Directory for output JSON files
        num_points (int): Number of points for triangulation
        extensions (tuple): Image file extensions to process
        square_size (int): Size of the square crop (if None, uses original min dimension)
        testing (bool): If True, skip the actual image processing (for tests)

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
    if not testing:
        print(f"Images will be cropped to {square_size}x{square_size} squares")

    # Process each image
    results = {}
    for image_file in image_files:
        image_path = Path(image_file)
        output_filename = image_path.stem + ".json"
        output_path = output_dir / output_filename

        triangles = process_image(
            image_file, output_path, num_points, square_size, testing
        )
        if triangles is not None:
            results[output_filename] = triangles

    print(f"Successfully processed {len(results)} out of {len(image_files)} images")
    return results
