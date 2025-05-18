#!/usr/bin/env python3
"""
Create Triangle Slideshow

Main entry point for creating a triangle-based slideshow from images.
"""

import argparse
import os
import sys
from pathlib import Path
import copy  # Added for deep copying slide data
import shutil  # Added for copying image files

from triangle_slideshow.processor import process_images
from triangle_slideshow.slideshow import Slideshow, save_slideshow, save_slideshow_split


def main():
    parser = argparse.ArgumentParser(
        description="Create a triangle-based slideshow from images"
    )

    parser.add_argument(
        "--input-dir",
        "-i",
        default="images/",
        help="Directory containing input images (default: images/)",
    )

    parser.add_argument(
        "--output-dir",
        "-o",
        default="silvan50frontend/public/data/",
        help="Directory for output files (default: silvan50frontend/public/data/)",
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
        help="Number of points for triangulation (default: 2000)",
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
        "--no-round-robin",
        action="store_false",
        dest="round_robin",
        help="Disable round-robin transitions (last slide transitions back to first)",
    )

    parser.add_argument(
        "--square-size",
        "-s",
        type=int,
        default=1080,
        help="Size of the square crop for all images in pixels (default: 1080)",
    )

    parser.add_argument(
        "--no-split",
        action="store_false",
        dest="split",
        help="Disable splitting slideshow into individual files",
    )

    parser.add_argument(
        "--copy-images",
        action="store_true",
        dest="copy_images",
        default=True,
        help="Copy original images to output directory (default: True)",
    )

    args = parser.parse_args()

    # Process input args
    input_dir = Path(args.input_dir)
    if not input_dir.exists():
        print(f"Error: Input directory {input_dir} does not exist")
        return 1

    sq_size = args.square_size

    # Setup output directory
    output_dir = Path(args.output_dir)
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
    print(f"Cropping images to {sq_size}x{sq_size} squares")
    if args.copy_images:
        print("Will copy original images to output directory")
    if args.split:
        print("Will split slideshow into individual files")
    if args.round_robin:
        print("Using round-robin transitions")
    else:
        print("Using sequential transitions only")

    # Process images to get triangles
    triangle_dict = process_images(
        input_dir=input_dir,
        output_dir=output_dir,
        num_points=args.points,
        extensions=extensions,
        square_size=sq_size,
    )

    if not triangle_dict:
        print("No images processed successfully. Cannot create initial black slide.")
        return 1

    # Copy original images to output directory if requested
    image_files = {}
    if args.copy_images:
        images_output_dir = output_dir / "images"
        os.makedirs(images_output_dir, exist_ok=True)
        print(f"Copying original images to {images_output_dir}")

        # Keys in triangle_dict are the original image filenames
        # Need to iterate through the original image files, not the json files
        image_extensions = extensions
        for filename in triangle_dict.keys():
            # Get the base name without extension to try each possible extension
            base_name = Path(filename).stem
            found = False

            # Try to locate the original file with the correct extension
            for ext in image_extensions:
                original_path = input_dir / f"{base_name}.{ext}"
                if original_path.exists():
                    # Found the image file with this extension
                    base_filename = f"{base_name}.{ext}"
                    output_path = images_output_dir / base_filename

                    # Copy the file
                    shutil.copy2(original_path, output_path)

                    # Store reference to the copied image (relative path from base output_dir)
                    image_files[filename] = f"images/{base_filename}"
                    print(f"Copied {original_path} to {output_path}")
                    found = True
                    break

            if not found:
                print(f"Warning: Could not find original image for {filename}")

    # Create slideshow
    slideshow = Slideshow()

    # Create and add the initial black slide
    try:
        # Get data from the alphabetically last image to use its geometry
        last_image_key = sorted(triangle_dict.keys())[-1]
        template_slide_data = triangle_dict[last_image_key]

        black_slide_data = copy.deepcopy(template_slide_data)

        # Modify dominant colors to black
        if isinstance(black_slide_data, dict):
            # Prioritize 'dominant_colors' (plural, list of strings)
            if "dominant_colors" in black_slide_data and isinstance(
                black_slide_data["dominant_colors"], list
            ):
                black_slide_data["dominant_colors"] = ["#000000"]
                # print("Set 'dominant_colors' to ['#000000'] for black slide.")
            else:
                # Fallback to checking other common dominant color keys for single values
                other_dominant_color_keys = [
                    "dominant_color",
                    "dominantColor",
                    "avg_color",
                    "average_color",
                ]
                found_other_key = False
                for dc_key in other_dominant_color_keys:
                    if dc_key in black_slide_data:
                        original_value = black_slide_data[dc_key]
                        if isinstance(original_value, str):  # Single hex string
                            black_slide_data[dc_key] = "#000000"
                            found_other_key = True
                            break
                        elif (
                            isinstance(original_value, (list, tuple))
                            and len(original_value) >= 3
                            and all(isinstance(n, int) for n in original_value)
                        ):
                            black_slide_data[dc_key] = tuple([0] * len(original_value))
                            found_other_key = True
                            break
                # if found_other_key:
                #     print(f"Set fallback dominant color field to black for black slide.")
                # else:
                #     print("Warning: Could not find or appropriately modify a known dominant color key for the black slide.")

        # Modify triangle colors to black
        triangle_data_list = None
        if isinstance(black_slide_data, list):
            triangle_data_list = black_slide_data
        elif isinstance(black_slide_data, dict):
            geometry_keys = [
                "triangles",
                "geometry",
                "verts",
                "vertices",
                "data",
                "points",
                "triangle_data",
                "triangles_data",
            ]
            for g_key in geometry_keys:
                if g_key in black_slide_data and isinstance(
                    black_slide_data[g_key], list
                ):
                    triangle_data_list = black_slide_data[g_key]
                    break

        if triangle_data_list:  # This should be the list of triangle objects
            for triangle_object in triangle_data_list:
                if isinstance(triangle_object, dict) and "color" in triangle_object:
                    color_value = triangle_object["color"]
                    if isinstance(color_value, list) and len(color_value) >= 3:
                        color_value[0] = 0
                        color_value[1] = 0
                        color_value[2] = 0

        slideshow.add_slide(black_slide_data, name="000_black_intro_slide")
        print("Added initial black slide using last image's geometry, colored black.")

    except Exception as e:
        print(f"Error creating initial black slide: {e}. Proceeding without it.")

    # Add original slides from triangle_dict
    for filename in sorted(triangle_dict.keys()):
        slide_name = Path(filename).stem
        triangles = triangle_dict[filename]

        # Add image file reference if available
        image_path = image_files.get(filename, None)
        slideshow.add_slide(triangles, name=slide_name, image_path=image_path)

    print(f"Created slideshow with {len(slideshow.slides)} slides")

    # Standardize triangle counts across all slides
    dummy_count = slideshow.standardize_triangle_counts()
    if dummy_count > 0:
        print(
            f"Added {dummy_count} dummy triangles to standardize slide triangle counts"
        )

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
    if args.split:
        # Save split files
        split_dir = output_file.parent
        manifest_path = save_slideshow_split(slideshow, split_dir)

        # Also save the complete file for backward compatibility
        save_slideshow(slideshow, output_file)

        print("\nSlideshow creation complete!")
        print(f"Split files saved to: {split_dir}")
        print(f"Manifest file: {manifest_path}")
        print(f"Complete slideshow: {output_file}")
    else:
        # Save as a single file
        save_slideshow(slideshow, output_file)

        print("\nSlideshow creation complete!")
        print(f"Output file: {output_file}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
