#!/usr/bin/env python
"""
Script to extract dominant colors from slide images and update the manifest.json file.
"""

import os
import json
from pathlib import Path
from triangle_slideshow.color_analyzer import extract_dominant_colors


def main():
    # Path to the manifest.json file
    manifest_path = Path("silvan50frontend/public/data/manifest.json")

    # Path to the images directory
    images_dir = Path("images")

    # Verify manifest.json exists
    if not manifest_path.exists():
        print(f"Error: Manifest file not found at {manifest_path}")
        return

    # Load manifest
    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    print(f"Loaded manifest with {manifest['total_slides']} slides")

    # Process each slide
    for slide in manifest["slides"]:
        image_name = slide["name"]
        print(f"Processing slide: {image_name}")

        # Look for matching image files with different extensions
        image_path = None
        for ext in [".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"]:
            potential_path = images_dir / f"{image_name}{ext}"
            if potential_path.exists():
                image_path = potential_path
                break

        if not image_path:
            print(f"  Warning: No image found for {image_name}")
            continue

        # Extract dominant colors
        dominant_colors = extract_dominant_colors(str(image_path))
        print(f"  Extracted colors: {dominant_colors}")

        # Update the slide with dominant colors
        slide["dominant_colors"] = dominant_colors

    # Save updated manifest
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Updated manifest saved to {manifest_path}")


if __name__ == "__main__":
    main()
