# Triangle Image Slideshow Generator

This tool processes images into triangular art and creates smooth transitions between them for use in slideshows. It uses the Hungarian algorithm to find optimal pairings between triangles in different images.

## Features

- Process multiple images into triangular art using the triangler library
- Create a structured slideshow with transitions between slides
- Optimized memory usage for large triangle sets
- Single entry point with simple command-line interface
- Modular design with clean separation of concerns

## Requirements

- Python 3.6+
- triangler module (must be in the Python path or in the included triangler_dir folder)
- NumPy, SciPy, scikit-image (skimage)

## Getting Started

### Installation

The tool automatically adds the local triangler_dir to the Python path if it exists.

1. Ensure you have the required dependencies:
   ```bash
   pip install numpy scipy scikit-image
   ```

   If using uv (as per instructions):
   ```bash
   uv pip install numpy scipy scikit-image
   ```

2. Make sure triangler is available:
   - Either use the included triangler_dir
   - Or install triangler in your environment

### Basic Usage

```bash
./create_slideshow.py -i /path/to/your/images -o /path/to/output
```

This will:
1. Process all supported images in the input directory
2. Generate triangle representations
3. Create transitions between slides
4. Save the slideshow to a JSON file

## Running Tests

To run the tests, you'll need to install the development dependencies:

```bash
pip install -r requirements-dev.txt
```

Or with uv:

```bash
uv pip install -r requirements-dev.txt
```

Then run the tests using pytest:

```bash
pytest
```

For test coverage reports:

```bash
pytest --cov=triangle_slideshow
```

### Command-Line Options

```
usage: create_slideshow.py [-h] --input-dir INPUT_DIR [--output-dir OUTPUT_DIR]
                           [--output-file OUTPUT_FILE] [--points POINTS] [--max-triangles MAX_TRIANGLES]
                           [--extensions EXTENSIONS] [--all-transitions]

Create a triangle-based slideshow from images

options:
  -h, --help            show this help message and exit
  --input-dir INPUT_DIR, -i INPUT_DIR
                        Directory containing input images
  --output-dir OUTPUT_DIR, -o OUTPUT_DIR
                        Directory for output files (default: <input_dir>/output)
  --output-file OUTPUT_FILE, -f OUTPUT_FILE
                        Output slideshow JSON file (default: <output_dir>/slideshow.json)
  --points POINTS, -p POINTS
                        Number of points for triangulation (default: 1000)
  --max-triangles MAX_TRIANGLES, -m MAX_TRIANGLES
                        Maximum number of triangles for transitions (default: 5000)
  --extensions EXTENSIONS, -e EXTENSIONS
                        Comma-separated list of image extensions to process (default: jpg,jpeg,png)
  --all-transitions, -a
                        Create transitions between all pairs of slides (default: only consecutive)
```

## How It Works

### Image Processing

The tool processes images using the triangler library, which converts images into triangle representations with the following steps:

1. Edge detection (using Sobel algorithm)
2. Point sampling in areas of interest 
3. Delaunay triangulation to create the triangle mesh
4. Color determination for each triangle

### Slideshow Structure

The slideshow JSON is structured as follows:

```json
{
  "slides": [
    {
      "name": "slide_0",
      "triangles": [
        {
          "coordinates": [[x1, y1], [x2, y2], [x3, y3]],
          "color": [r, g, b]
        },
        ...
      ]
    },
    ...
  ],
  "transitions": [
    {
      "from": 0,
      "to": 1,
      "pairings": [
        {
          "from_index": 0,
          "to_index": 2,
          "distance": 0.5
        },
        ...
      ]
    },
    ...
  ]
}
```

### Transition Generation

Transitions between slides are created using the Hungarian algorithm:

1. Calculate centroids for all triangles in both slides
2. Create a cost matrix where each cell represents the distance between two triangle centroids
3. Use the Hungarian algorithm to find the optimal pairing that minimizes the total distance
4. Store the pairings in the slideshow JSON for use by the frontend

## Architecture

The package is organized in a modular way:

- `create_slideshow.py`: Main entry point script
- `triangle_slideshow/`: Package directory
  - `processor.py`: Image processing with triangler
  - `transition.py`: Creating transitions between slides
  - `slideshow.py`: Slideshow structure and serialization

## License

MIT 