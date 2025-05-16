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
    *   **Default Behavior:** By default, processes images from `./images/`, outputs to `./silvan50frontend/public/data/`, uses `2000` points for triangulation, enables round-robin transitions, and splits the slideshow into individual files. These can be overridden by respective CLI arguments (e.g., `--no-round-robin`, `--no-split`, `--input-dir`, etc.).
*   **Core Components:**
    * `processor.py`: Handles image processing with triangler
    * `transition.py`: Manages transition creation using the Hungarian algorithm
    * `slideshow.py`: Provides data structures and operations for slideshows
*   **Shell Script Interface:** Simplified interface for batch processing (legacy).

**Data Flow:**

1. Input images from a directory are processed by `triangle_slideshow.processor` module
2. Triangle representations are generated for each image.
3. **Initial Black Slide**: Before user images are added, an initial black slide (`"000_black_intro_slide"`) is created. It uses the triangle geometry of the alphabetically last processed user image, but all its triangle colors and dominant color(s) are set to black (`#000000`). This slide is always the first (index 0) in the sequence.
4. The `Slideshow` class from `slideshow.py` manages the collection of slides, including the prepended black slide and then the user image slides.
5. Triangle standardization ensures all slides have the same number of triangles.
6. Transitions between slides are created using the Hungarian algorithm from `transition.py`.
7. The complete slideshow with transitions is serialized to JSON format (manifest file and individual slide/transition files if split).

**Triangle Standardization:**

* Implemented in the `standardize_triangle_counts` method of the `Slideshow` class
* Finds the maximum triangle count across all slides
* Adds "dummy triangles" with opacity=0 to slides with fewer triangles
* Copies positions for dummy triangles from adjacent slides
* Ensures all slides have the same number of triangles for consistent transitions
* Preserves original triangles with opacity=1
* Follows a hierarchical approach to find suitable positions for dummy triangles:
  1. Try positions from the same index in next slide
  2. Try positions from the same index in previous slide
  3. Try positions from the same index in any slide
  4. Use a position from the first triangle of any slide
  5. Fallback to a default position if all else fails

**Triangle Transitions:**

*   Two transition modes available:
    * Sequential (default): Creates transitions between consecutive slides (1→2, 2→3)
    * Round-robin: Creates a circular pattern including transition from last to first (1→2→3→1)
*   Both modes use the Hungarian algorithm for optimal triangle matching
*   `create_transition` function calculates cost matrix based on centroid distances
*   `linear_sum_assignment` from scipy.optimize provides the optimal pairing solution

**Slideshow Data Model:**

*   Core `Slideshow` class maintains:
    * List of slides (each with triangles and metadata, including dominant colors).
    * List of transitions (each with source, target, and pairings) *in memory*.
*   Methods for adding slides, creating transitions, and serialization.
*   **Serialization (`to_dict`, `save_slideshow`, `save_slideshow_split`):** When serialized to a dictionary or JSON files (especially the main manifest if split), transition information is nested within each slide object under a `"transitions"` key. This key holds a list of transitions *originating from that slide*. There is no top-level `"transitions"` array in the output JSON manifest.
*   Support for both manual transition creation and automatic patterns.
*   Each transition contains pairings that map source triangles to target triangles
*   Triangles may include opacity value (1.0 for normal, 0.0 for dummy triangles)

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
*   Specific tests for triangle standardization and round-robin transitions

## Frontend Visualization

> **Note:** The previous frontend implementation has been deleted and will be rebuilt from scratch.

**Planned Architecture:**

*   **Framework:** React with TypeScript
*   **Rendering:** SVG or Canvas for 2D rendering of triangles
*   **Animation:** GSAP or similar for smooth animations
*   **State Management:** React state hooks for data loading and state
*   **UI Controls:** Interactive parameter adjustment

**Required Features:**

*   Loading JSON data from triangle slideshow files
*   Rendering triangles with proper color, position, and opacity
*   Handling dummy triangles (opacity=0) correctly
*   Supporting transitions between slide pairs
*   Providing user controls for selecting transitions
*   Supporting both sequential and round-robin transition models

**Data Model Integration:**

*   Frontend will need to parse and understand:
    * Slideshow JSON format with slides and transitions
    * Triangle data with coordinates, color, and opacity
    * Transition pairings between triangle sets
*   Must correctly handle dummy triangles with opacity=0

## Backend-Frontend Interaction

*   Loose coupling via file system: The backend generates JSON data, which the frontend consumes.
*   The frontend will load slideshow JSON files from a designated location.
*   The standardized triangle counts will ensure consistent transitions in the new frontend. 