# System Patterns: Triangler & Visualizer

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

## Frontend (`frontend/` React App)

**Architecture:**

*   **Framework:** React with TypeScript.
*   **Build Tool:** Vite.
*   **Rendering:** Three.js via `@react-three/fiber` (declarative scene definition) and `@react-three/drei` (helpers like `OrbitControls`).
*   **State Management:** React `useState` and `useEffect` for data loading and basic state.
*   **Component Structure:** `App.tsx` serves as the main component, containing scene setup, data fetching, and rendering logic. A `TriangleMesh` component encapsulates the rendering of a single triangle.

**Data Flow:**

1.  `App.tsx` fetches `data.json` from the `/public` directory using `fetch` within a `useEffect` hook.
2.  Fetched triangle data is stored in React state (`triangles`).
3.  The component maps over the `triangles` state array, rendering a `TriangleMesh` component for each triangle.
4.  `TriangleMesh` creates `BufferGeometry` and `MeshBasicMaterial` based on the passed triangle data.

**Debugging:**

*   The `leva` library provides an on-screen debug UI for tweaking parameters (e.g., lighting, group transforms) in real-time.
*   `useControls` hook is used to define and manage these debuggable parameters.

**Interaction:**

*   `OrbitControls` from `@react-three/drei` enables camera manipulation (orbit, zoom, pan).

## Backend-Frontend Interaction

*   Loose coupling via file system: The backend generates `data.json`, which the frontend consumes.
*   The frontend assumes `data.json` is present in its `public` directory at build/run time. 