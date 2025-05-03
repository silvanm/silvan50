# Technical Context: Triangler-based Image Processing

## Backend Technologies

### Core Technologies:

*   **Python 3.6+**: Primary programming language for all backend components
*   **triangler**: Custom triangulation library (external dependency or locally installed)
*   **NumPy**: Used for efficient numeric operations and array manipulations
*   **SciPy**: Provides the Hungarian algorithm for optimal triangle matching
*   **PIL/Pillow**: Image processing library for loading and manipulating images

### Triangle Slideshow Package:

*   **triangle_slideshow**: Modular Python package for slideshow creation
    * `processor.py`: Interface with triangler for image processing
    * `transition.py`: Transition generation using the Hungarian algorithm
    * `slideshow.py`: Slideshow data structure and operations

### Code Organization:

*   **Repository Structure:**
    * `triangle_slideshow/`: Core package with modular components
    * `tests/`: Comprehensive test suite with unit and end-to-end tests
    * `create_slideshow.py`: Main entry point for slideshow creation

### Key Algorithms:

*   **Triangulation Process**:
    1. Edge detection (Sobel, Canny) to identify important features
    2. Sampling (Poisson disk) to place points at features
    3. Delaunay triangulation to create triangle mesh
    4. Color calculation (mean or centroid) for each triangle
    
*   **Hungarian Algorithm** (in `transition.py`):
    1. Calculate triangle centroids
    2. Generate cost matrix of distances between all triangle pairs
    3. Apply linear_sum_assignment to find optimal pairings
    4. Create transitions with source-target triangle mappings
    
*   **Transition Modes**:
    1. **Sequential (default)**: Creates transitions between consecutive slides only (1→2, 2→3)
    2. **Round-Robin**: Creates transitions between consecutive slides and adds a final transition from the last slide back to the first (1→2→3→1)
    3. Simple CLI option (`--round-robin`) to choose between modes

### Testing Framework:

*   **pytest**: Primary testing framework
*   **unittest.mock**: For mocking external dependencies and components
*   **Test fixtures**: Predefined triangle sets and expected results
*   **End-to-end tests**: Verifying the full process from images to slideshow JSON

## Frontend Technologies

*   **React 18.3.0**: JavaScript library for UI components and state management
*   **TypeScript 5.3.3**: Type safety and improved developer experience
*   **Vite 6.3.2**: Next-generation frontend build tool
*   **SVG**: Scalable Vector Graphics for rendering triangles
*   **GSAP**: GreenSock Animation Platform for smooth transitions
*   **leva**: Interactive UI controls for debugging and parameter adjustment
*   **Node.js v18.20.6**: Runtime environment (version constraint due to compatibility)

## Development Environment

*   **Virtual Environment**: Local Python virtual environment in triangler_dir/venv
*   **Git**: Version control system
*   **npm/yarn**: Package management for frontend dependencies
*   **Node.js**: JavaScript runtime (version 18.x required for compatibility)

## Deployment Considerations

*   **Triangler Installation**: 
    * Direct installation in virtualenv (preferred)
    * Local module in triangler_dir (alternative)
*   **Memory Requirements**: 
    * Hungarian algorithm requires significant memory for large triangle sets
    * Max triangle limit may be needed for very detailed images
*   **Frontend Compatibility**:
    * Vite 6.3.2 requires Node.js v18.x
    * Error `SyntaxError: Invalid regular expression flags` with newer Node.js versions

## JSON Output Format

*   **Slideshow JSON Structure**:
    ```json
    {
      "slides": [
        {
          "name": "slide_name",
          "triangles": [/* Array of triangles */]
        }
      ],
      "transitions": [
        {
          "from": 0,
          "to": 1,
          "pairings": [/* Array of triangle pairings */]
        }
      ]
    }
    ```

*   **Triangle Format**:
    ```json
    {
      "coordinates": [[x1,y1], [x2,y2], [x3,y3]],
      "color": [r, g, b]
    }
    ```

*   **Pairing Format**:
    ```json
    {
      "from_index": 0,
      "to_index": 1,
      "distance": 5.2
    }
    ``` 