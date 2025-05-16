#!/usr/bin/env python
"""
Script to reorder dominant colors in the manifest.json file according to the new criteria.

The criteria for color ordering is:
1. First color is the lightest
2. Second color is the most saturated
3. Third color is the darkest
"""

import os
import json
from pathlib import Path
from triangle_slideshow.color_analyzer import reorder_colors


def main():
    # Path to the manifest.json file
    manifest_path = Path("silvan50frontend/public/data/manifest.json")

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
        if "dominant_colors" in slide and len(slide["dominant_colors"]) >= 3:
            print(f"Processing slide: {slide['name']}")

            # Get the current colors for logging
            current_colors = slide["dominant_colors"]
            print(f"  Current colors: {current_colors}")

            # First, ensure no duplicates in the list
            unique_colors = list(dict.fromkeys(current_colors))

            # Then reorder them
            reordered_colors = reorder_colors(unique_colors)
            print(f"  Reordered colors: {reordered_colors}")

            # Update the manifest
            slide["dominant_colors"] = reordered_colors

    # Save updated manifest
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"Updated manifest saved to {manifest_path}")


if __name__ == "__main__":
    main()
