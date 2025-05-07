#!/usr/bin/env python3
"""
Split an existing slideshow JSON file into individual slides and transitions.

This script reads a slideshow JSON file and exports individual files for
each slide and transition, along with a manifest file.
"""

import argparse
import os
import shutil
from pathlib import Path
from triangle_slideshow.slideshow import load_slideshow, save_slideshow_split


def main():
    """Main function to split a slideshow file."""
    parser = argparse.ArgumentParser(
        description="Split a slideshow JSON file into individual files"
    )
    parser.add_argument("input_file", help="Path to the input slideshow JSON file")
    parser.add_argument(
        "--output-dir",
        default="public/data",
        help="Directory where split files will be saved (default: public/data)",
    )
    parser.add_argument(
        "--frontend-dir",
        default="silvan50frontend",
        help="Root directory of the frontend application (default: silvan50frontend)",
    )

    args = parser.parse_args()

    # Ensure the input file exists
    if not os.path.exists(args.input_file):
        print(f"Error: Input file '{args.input_file}' does not exist")
        return 1

    # Create the output directory relative to the frontend directory
    output_dir = os.path.join(args.frontend_dir, args.output_dir)
    os.makedirs(output_dir, exist_ok=True)

    print(f"Loading slideshow from {args.input_file}...")
    slideshow = load_slideshow(args.input_file)

    # Check if the slideshow has slides
    if not slideshow.slides:
        print("Error: The slideshow contains no slides")
        return 1

    print(
        f"Splitting slideshow with {len(slideshow.slides)} slides into {output_dir}..."
    )
    manifest_path = save_slideshow_split(slideshow, output_dir)

    # Also copy the original slideshow.json for backward compatibility
    shutil.copy(args.input_file, os.path.join(output_dir, "slideshow.json"))

    print(f"Slideshow split successfully!\nManifest saved to: {manifest_path}")
    print(f"Total slides: {len(slideshow.slides)}")
    print(f"Total transitions: {len(slideshow.transitions)}")

    # Calculate the size reduction
    original_size = os.path.getsize(args.input_file)
    manifest_size = os.path.getsize(manifest_path)
    individual_files_size = sum(
        os.path.getsize(os.path.join(output_dir, f))
        for f in os.listdir(output_dir)
        if f != "slideshow.json"  # Exclude the original file
    )

    # Calculate the maximum file size among the split files
    max_file_size = max(
        os.path.getsize(os.path.join(output_dir, f))
        for f in os.listdir(output_dir)
        if f != "slideshow.json"  # Exclude the original file
    )

    print(f"Original file size: {original_size / (1024 * 1024):.2f} MB")
    print(f"Sum of individual files: {individual_files_size / (1024 * 1024):.2f} MB")
    print(f"Largest individual file: {max_file_size / (1024 * 1024):.2f} MB")
    print(
        f"Storage overhead: {((individual_files_size + original_size) / original_size - 1) * 100:.1f}%"
    )
    print(
        f"Max individual file size reduction: {(1 - max_file_size / original_size) * 100:.1f}%"
    )

    return 0


if __name__ == "__main__":
    exit(main())
