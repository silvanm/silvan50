# System Patterns: Triangler & Visualizer

> **Note:** For a visual representation of the complete system workflow, see [workflow_diagram.md](workflow_diagram.md)

## Backend (`triangler` Python tool)

**Core Logic Encapsulation:**

*   The main image processing and triangulation logic resides in `triangler/triangler/converter.py` within the `convert` function.
*   Helper modules for specific steps (edge detection, sampling, rendering) are organized into subdirectories (`edge_detectors`, `samplers`, `renderers`).

**Configuration:**

*   Processing steps (edge detection, sampling, rendering method, output format) are configurable via parameters passed to the `convert` function.
*   A `TrianglerConfig` object likely holds some of these configuration values (Needs verification by reading `config.py`).

**Command-Line Interface (CLI):**

*   `triangler/triangler/__main__.py` provides the CLI using `argparse`.
*   It parses user arguments and maps them to the parameters of the `convert` function.

**Output Handling:**

*   The `convert` function handles multiple output formats (`image`, `json`) based on the `output_format` parameter.
*   Logic for calculating triangle data (coordinates, color) is centralized.
*   File saving logic (image or JSON) is within the `convert` function, triggered by `output_path`.

## Batch Processing & Transition Generation System

**Architecture:**

*   **Modular Package:** Code organized into `triangle_slideshow` Python package with specialized modules.
*   **Entry Point:** `create_slideshow.py` provides a unified CLI for all functionality.
*   **Core Components:**
    * `processor.py`: Handles image processing with triangler
    * `transition.py`: Manages transition creation using the Hungarian algorithm
    * `slideshow.py`: Provides data structures and operations for slideshows
*   **Shell Script Interface:** Simplified interface for batch processing (legacy).

**Data Flow:**

1. Input images from a directory are processed by `triangle_slideshow.processor` module
2. Triangle representations are generated for each image
3. The `Slideshow` class from `slideshow.py` manages the collection of slides
4. Transitions between slides are created using the Hungarian algorithm from `transition.py`
5. The complete slideshow with transitions is serialized to JSON format

**Triangle Transitions:**

*   Two transition modes available:
    * Sequential (default): Creates transitions between consecutive slides (1→2, 2→3)
    * Round-robin: Creates a circular pattern including transition from last to first (1→2→3→1)
*   Both modes use the Hungarian algorithm for optimal triangle matching
*   `create_transition` function calculates cost matrix based on centroid distances
*   `linear_sum_assignment` from scipy.optimize provides the optimal pairing solution

**Slideshow Data Model:**

*   Core `Slideshow` class maintains:
    * List of slides (each with triangles and metadata)
    * List of transitions (each with source, target, and pairings)
*   Methods for adding slides, creating transitions, and serialization
*   Support for both manual transition creation and automatic patterns
*   Each transition contains pairings that map source triangles to target triangles

**Hungarian Algorithm Implementation:**

*   Implemented in `transition.py` module
*   Calculates cost matrix based on triangle centroid distances
*   Ensures triangles are matched optimally based on spatial positioning
*   Handles triangle sets of different sizes
*   Supports limiting the number of triangles for memory efficiency
*   Automatically transposes the problem if the target set is smaller than the source

**Testing Framework:**

*   Comprehensive unit tests for all core functionality
*   End-to-end tests that verify the entire process flow
*   Test fixtures with sample triangle data for consistent testing
*   Mocking of external dependencies (triangler) for reliable test execution

## Frontend (`frontend/` React App)

**Architecture:**

*   **Framework:** React with TypeScript.
*   **Build Tool:** Vite.
*   **Rendering:** SVG for 2D rendering of triangles.
*   **Animation:** GSAP for performant, timeline-based animations.
*   **State Management:** React `useState` and `useEffect` for data loading and basic state.
*   **UI Controls:** Leva for interactive parameter adjustment.

**Rendering Approach:**

*   SVG-based rendering using React's SVG elements (`<svg>`, `<g>`, `<polygon>`).
*   Each triangle is rendered as a separate `<polygon>` element with points derived from the JSON data.
*   Colors converted from numeric format to CSS color strings.
*   SVG viewBox and transforms used for proper positioning and scaling.

**Animation System:**

*   GSAP used for creating smooth, performant animations.
*   References to animation tweens stored in React refs for proper cleanup.
*   Random target positions and rotations calculated for each triangle.
*   Animation parameters (duration, distance) controlled via Leva UI.
*   Group transformations (position, scale, rotation) animated with GSAP.

**Data Flow:**

1.  Frontend first loads `combined_data.json` as the default transition
2.  It then fetches the list of available transitions from the `/transitions` endpoint
3.  User can select different transitions through the UI
4.  Selected transition data is fetched and used to render triangles
5.  Animations are applied to triangles based on UI control settings

**Transition Handling:**

*   Transitions represented as JSON files containing triangles_a, triangles_b, and pairings arrays
*   Triangle data includes coordinates and colors 
*   Pairings map triangles between sets based on the Hungarian algorithm results
*   Animation system uses these pairings to create smooth transitions

**Debugging:**

*   The `leva` library provides an on-screen debug UI for tweaking parameters in real-time.
*   Separated control groups for animation, triangle group transformations, and display settings.

## Backend-Frontend Interaction

*   Loose coupling via file system: The backend generates JSON data, which the frontend consumes.
*   The frontend assumes JSON files are present in its `public` directory at build/run time.
*   `process_images.sh` can automatically copy files to the frontend with the `--serve` option. 