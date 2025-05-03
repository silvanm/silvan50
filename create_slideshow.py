#!/usr/bin/env python3
"""
Create Triangle Slideshow

Main entry point for creating a triangle-based slideshow from images.
"""

import argparse
import os
import sys
from pathlib import Path

from triangle_slideshow.processor import process_images
from triangle_slideshow.slideshow import Slideshow, save_slideshow


def main():
    parser = argparse.ArgumentParser(
        description="Create a triangle-based slideshow from images"
    )

    parser.add_argument(
        "--input-dir", "-i", required=True, help="Directory containing input images"
    )

    parser.add_argument(
        "--output-dir",
        "-o",
        help="Directory for output files (default: <input_dir>/output)",
    )

    parser.add_argument(
        "--output-file",
        "-f",
        help="Output slideshow JSON file (default: <output_dir>/slideshow.json)",
    )

    parser.add_argument(
        "--points",
        "-p",
        type=int,
        default=1000,
        help="Number of points for triangulation (default: 1000)",
    )

    parser.add_argument(
        "--max-triangles",
        "-m",
        type=int,
        default=5000,
        help="Maximum number of triangles for transitions (default: 5000)",
    )

    parser.add_argument(
        "--extensions",
        "-e",
        default="jpg,jpeg,png",
        help="Comma-separated list of image extensions to process (default: jpg,jpeg,png)",
    )

    parser.add_argument(
        "--round-robin",
        "-r",
        action="store_true",
        help="Create round-robin transitions (last slide transitions back to first)",
    )

    args = parser.parse_args()

    # Process input args
    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"Error: Input directory {input_dir} does not exist")
        return 1

    # Setup output directory
    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = input_dir / "output"

    os.makedirs(output_dir, exist_ok=True)

    # Setup output file
    if args.output_file:
        output_file = Path(args.output_file)
    else:
        output_file = output_dir / "slideshow.json"

    # Parse extensions
    extensions = args.extensions.split(",")

    print(f"Processing images from {input_dir}")
    print(f"Output directory: {output_dir}")
    print(f"Output slideshow: {output_file}")
    print(f"Using {args.points} points for triangulation")
    print(f"Max triangles for transitions: {args.max_triangles}")

    # Process images to get triangles
    triangle_dict = process_images(
        input_dir=input_dir,
        output_dir=output_dir,
        num_points=args.points,
        extensions=extensions,
    )

    if not triangle_dict:
        print("No images processed successfully")
        return 1

    # Create slideshow
    slideshow = Slideshow()

    # Add slides in alphabetical order by filename
    for filename in sorted(triangle_dict.keys()):
        slide_name = Path(filename).stem
        triangles = triangle_dict[filename]
        slideshow.add_slide(triangles, name=slide_name)

    print(f"Created slideshow with {len(slideshow.slides)} slides")

    # Create transitions
    print("Creating transitions between slides...")
    transition_count = 0

    if args.round_robin:
        # Use round-robin transitions (including from last to first)
        transition_count = slideshow.round_robin_transitions(
            max_triangles=args.max_triangles
        )
    else:
        # Use sequential transitions (default)
        transition_count = slideshow.auto_create_transitions(
            max_triangles=args.max_triangles,
            sequential_only=True,  # Always use sequential mode
        )

    print(f"Created {transition_count} transitions")

    # Save slideshow
    save_slideshow(slideshow, output_file)

    print("\nSlideshow creation complete!")
    print(f"Output file: {output_file}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
