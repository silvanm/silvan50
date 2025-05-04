# Triangle Slideshow Frontend

This is a Next.js application that displays an artistic slideshow of triangles with smooth transitions between slides. The slides are rendered using SVG, and the transitions are animated using GSAP.

## Features

- SVG-based rendering of triangle compositions
- Smooth GSAP animations between slides
- Automatic slide transitions with configurable timing
- Responsive design
- Color transitions and shape morphing

## Prerequisites

- Node.js 16.8.0 or later
- NPM or Yarn

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Make sure the slideshow data is available at `src/data/slideshow.json`

## Running the application

Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the slideshow.

## Project Structure

- `src/components/Slideshow.tsx` - The main slideshow component
- `src/utils/slideshow-data.ts` - Types and data loader for the slideshow
- `src/data/slideshow.json` - The slideshow data file
- `src/app/page.tsx` - The main page that displays the slideshow
- `src/app/globals.css` - Global styles for the application

## Configuration

You can adjust the slideshow behavior by modifying the following constants in the `Slideshow.tsx` file:

- `TRANSITION_DURATION` - The duration of the transition between slides (in seconds)
- `SLIDE_DISPLAY_DURATION` - How long each slide is displayed before transitioning (in seconds)

## How the Slideshow Works

The slideshow works by:

1. Loading triangle data from the JSON file
2. Rendering the current slide using SVG polygons
3. When transitioning to the next slide, GSAP animates each triangle to its new position, color, and shape
4. The pairings in the JSON data determine which triangles morph into which other triangles

## Data Format

The slideshow data is structured as follows:

```typescript
interface SlideshowData {
  slides: Slide[];
  transitions: Transition[];
}

interface Slide {
  triangles: Triangle[];
  name: string;
}

interface Triangle {
  coordinates: [number, number][];  // 3 coordinate pairs for the triangle
  color: [number, number, number];  // RGB values
  opacity?: number;
}

interface Transition {
  from: number;  // Index of the starting slide
  to: number;    // Index of the destination slide
  pairings: Pairing[];
}

interface Pairing {
  from_index: number;  // Triangle index in the 'from' slide
  to_index: number;    // Triangle index in the 'to' slide
  distance: number;    // Distance metric (used for sorting)
}
```

## Acknowledgements

- GSAP for the animation library
- Next.js for the React framework
- The triangle slideshow data generator
