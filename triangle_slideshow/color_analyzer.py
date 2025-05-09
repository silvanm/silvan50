"""
Color Analyzer module for triangle slideshow.

This module extracts dominant colors from images using K-means clustering.
"""

from PIL import Image
import numpy as np
from sklearn.cluster import KMeans


def extract_dominant_colors(image_path, num_colors=3):
    """
    Extract dominant colors from an image using K-means clustering.

    Args:
        image_path (str): Path to the image file
        num_colors (int): Number of dominant colors to extract

    Returns:
        list: Hex color codes of dominant colors, sorted by prevalence
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

        return hex_colors
    except Exception as e:
        print(f"Error extracting colors from {image_path}: {e}")
        return [f"#FFFFFF" for _ in range(num_colors)]  # Return white as fallback
