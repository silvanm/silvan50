# Technical Context: Triangler & Visualizer

## Backend (`triangler` Python tool)

**Language:** Python

**Key Libraries:**

*   **NumPy:** Core numerical operations, array manipulation.
*   **Scikit-image (skimage):** Image loading, processing (drawing polygons, pyramid reduction), saving.
*   **SciPy:** Spatial algorithms, specifically `scipy.spatial.Delaunay` for triangulation.
*   **argparse:** Parsing command-line arguments.
*   **json:** Handling JSON serialization for the JSON output format.

**Project Structure:**

*   Main package: `triangler/triangler/`
    *   Core logic: `converter.py`
    *   CLI entry point: `__main__.py`
    *   Configuration: `config.py`
    *   Helper modules: `edge_detectors/`, `samplers/`, `renderers/`
*   Setup: `setup.py` (suggests standard Python packaging)
*   Dependencies: `requirements.txt`

**Development Environment:**

*   Requires Python environment with libraries listed in `requirements.txt` installed.
*   Run using `python -m triangler ...` command.

## Frontend (`frontend/` React App)

**Language:** TypeScript, JavaScript (JSX)

**Framework/Libraries:**

*   **React:** UI framework.
*   **Vite:** Build tool and development server.
*   **Three.js:** Core 3D graphics library.
*   **@react-three/fiber:** React renderer for Three.js.
*   **@react-three/drei:** Helper components and hooks for `@react-three/fiber` (e.g., `OrbitControls`).
*   **leva:** Debug UI controls.

**Project Structure:**

*   Located in `frontend/` directory.
*   Standard Vite React TS structure (`src/`, `public/`, `index.html`, `package.json`, `tsconfig.json`, etc.).
*   Main application logic in `src/App.tsx`.
*   Input data (`data.json`) expected in `public/`.

**Package Manager:** npm

**Development Environment:**

*   Requires Node.js and npm.
*   Install dependencies: `cd frontend && npm install` (Note: `leva` required `--legacy-peer-deps` due to React 19 conflict).
*   Run development server: `npm run dev`. 