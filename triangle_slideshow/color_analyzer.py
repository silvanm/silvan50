"""
Color Analyzer module for triangle slideshow.

This module extracts dominant colors from images using K-means clustering.
"""

from PIL import Image
import numpy as np
from sklearn.cluster import KMeans
import colorsys


def rgb_to_hsv(rgb):
    """
    Convert RGB color to HSV.

    Args:
        rgb: RGB color as a tuple of values between 0-255

    Returns:
        HSV values as a tuple (h, s, v)
    """
    r, g, b = [x / 255.0 for x in rgb]
    return colorsys.rgb_to_hsv(r, g, b)


def hex_to_rgb(hex_color):
    """
    Convert hex color string to RGB tuple.

    Args:
        hex_color: Color in format "#RRGGBB"

    Returns:
        Tuple of RGB values (0-255)
    """
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def reorder_colors(hex_colors):
    """
    Reorder colors according to the criteria:
    1. First color is the lightest
    2. Second color is the most saturated
    3. Third color is the darkest

    Algorithm:
    1. First, identify the most saturated color (which will be placed second)
    2. Then from the remaining colors, select the lightest (for first position)
    3. The darkest of the remaining colors will be placed third

    Args:
        hex_colors: List of hex color strings

    Returns:
        Reordered list of colors
    """
    # First, ensure we have unique colors
    unique_colors = list(dict.fromkeys(hex_colors))

    if len(unique_colors) < 3:
        return unique_colors

    # Convert hex colors to RGB and then to HSV for comparison
    color_data = []
    for hex_color in unique_colors:
        rgb = hex_to_rgb(hex_color)
        h, s, v = rgb_to_hsv(rgb)
        color_data.append({"hex": hex_color, "brightness": v, "saturation": s})

    # 1. Find the most saturated color first (will be placed second)
    most_saturated = max(color_data, key=lambda x: x["saturation"])

    # 2. From the remaining colors, find the lightest and darkest
    remaining_colors = [c for c in color_data if c["hex"] != most_saturated["hex"]]

    if not remaining_colors:
        return [most_saturated["hex"]]

    # Sort the remaining colors by brightness (descending)
    remaining_colors.sort(key=lambda x: x["brightness"], reverse=True)

    # 3. Combine the result in the correct order:
    # lightest, most_saturated, darkest
    result = [
        remaining_colors[0]["hex"],  # lightest
        most_saturated["hex"],  # most saturated
    ]

    # Add any remaining colors (darkest first, then others)
    for i in range(1, len(remaining_colors)):
        result.append(remaining_colors[i]["hex"])

    return result


def test_reorder_colors():
    """
    Test function to verify color reordering logic.
    """
    # Test case 1: Simple black, blue, white
    test_colors = ["#000000", "#0000ff", "#ffffff"]
    expected = ["#ffffff", "#0000ff", "#000000"]

    # Print debug info for each color's HSV values
    print("\nDEBUG: HSV values for test colors:")
    for color in test_colors:
        rgb = hex_to_rgb(color)
        h, s, v = rgb_to_hsv(rgb)
        print(f"Color: {color}, HSV: ({h:.2f}, {s:.2f}, {v:.2f})")

    result = reorder_colors(test_colors)
    print(f"Test 1 - Input: {test_colors}")
    print(f"Test 1 - Expected: {expected}")
    print(f"Test 1 - Result: {result}")
    print(f"Test 1 - Pass: {result == expected}")

    # Test case 2: More complex colors
    test_colors = ["#8f7f6b", "#d1c8c1", "#1a1611"]
    result = reorder_colors(test_colors)
    print(f"\nTest 2 - Input: {test_colors}")
    print(f"Test 2 - Result: {result}")

    # Test case 3: Duplicate colors
    test_colors = ["#5d462e", "#dbdad5", "#5d462e"]
    result = reorder_colors(test_colors)
    print(f"\nTest 3 - Input: {test_colors}")
    print(f"Test 3 - Result: {result}")
    print(f"Test 3 - No duplicates: {len(set(result)) == len(result)}")
    print(
        f"Test 3 - Expected behavior: Should only have 2 colors since there's a duplicate"
    )

    # Test case 4: Edge case - very similar colors with same brightness but different saturation
    test_colors = ["#888888", "#884488", "#888844"]  # Gray, Purple-ish, Yellow-ish
    result = reorder_colors(test_colors)
    print(f"\nTest 4 - Input: {test_colors}")
    print(f"Test 4 - Result: {result}")

    # Add debug output for color values
    print("\nDEBUG: HSV values for test 4 colors:")
    for color in test_colors:
        rgb = hex_to_rgb(color)
        h, s, v = rgb_to_hsv(rgb)
        print(f"Color: {color}, HSV: ({h:.2f}, {s:.2f}, {v:.2f})")


def extract_dominant_colors(image_path, num_colors=5):
    """
    Extract dominant colors from an image using K-means clustering.

    Args:
        image_path (str): Path to the image file
        num_colors (int): Number of dominant colors to extract

    Returns:
        list: Hex color codes of dominant colors, sorted according to:
             1. First color is the lightest
             2. Second color is the most saturated
             3. Third color is the darkest
             (followed by remaining colors)
    """
    try:
        # Open and resize image for faster processing
        img = Image.open(image_path)
        img = img.resize((150, 150))

        # Convert to RGB if not already
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Convert to numpy array for processing
        img_array = np.array(img)
        pixels = img_array.reshape(-1, 3)

        # Apply K-means clustering
        kmeans = KMeans(n_clusters=num_colors)
        kmeans.fit(pixels)

        # Get colors and sort by cluster size
        colors = kmeans.cluster_centers_
        counts = np.bincount(kmeans.labels_)
        colors_with_counts = sorted(
            zip(colors, counts), key=lambda x: x[1], reverse=True
        )

        # Convert to hex format
        hex_colors = [
            "#%02x%02x%02x" % tuple(map(int, color)) for color, _ in colors_with_counts
        ]

        # Reorder colors based on criteria
        reordered_colors = reorder_colors(hex_colors)

        return reordered_colors
    except Exception as e:
        print(f"Error extracting colors from {image_path}: {e}")
        return [f"#FFFFFF" for _ in range(num_colors)]  # Return white as fallback


# Run test when module is executed directly
if __name__ == "__main__":
    test_reorder_colors()
