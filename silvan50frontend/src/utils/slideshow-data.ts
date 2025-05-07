export interface Triangle {
  coordinates: [number, number][];
  color: [number, number, number];
  opacity?: number;
}

export interface Slide {
  triangles: Triangle[];
  name: string;
}

export interface Pairing {
  from_index: number;
  to_index: number;
  distance: number;
}

export interface Transition {
  from: number;
  to: number;
  pairings: Pairing[];
}

export interface SlideTransition {
  to: number;
  filename: string;
}

export interface ManifestSlide {
  index: number;
  name: string;
  filename: string;
  transitions: SlideTransition[];
}

export interface SlideshowManifest {
  total_slides: number;
  slides: ManifestSlide[];
}

export interface SlideshowData {
  slides: Slide[];
  transitions: Transition[];
}

// Function to load the manifest file
export async function loadSlideshowManifest(): Promise<SlideshowManifest> {
  console.log("Fetching manifest from: /data/manifest.json");
  try {
    const response = await fetch('/data/manifest.json');
    if (!response.ok) {
      const error = `Failed to load slideshow manifest: ${response.status} ${response.statusText}`;
      console.error(error);
      throw new Error(error);
    }
    const data = await response.json() as SlideshowManifest;
    console.log("Manifest loaded successfully:", data);
    return data;
  } catch (error) {
    console.error("Error loading manifest:", error);
    throw error;
  }
}

// Function to load a slide by filename
export async function loadSlide(filename: string): Promise<Slide> {
  console.log(`Fetching slide from: /data/${filename}`);
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      const error = `Failed to load slide: ${filename} - ${response.status} ${response.statusText}`;
      console.error(error);
      throw new Error(error);
    }
    const data = await response.json() as Slide;
    console.log(`Slide ${filename} loaded successfully:`, data);
    return data;
  } catch (error) {
    console.error(`Error loading slide ${filename}:`, error);
    throw error;
  }
}

// Function to load a transition by filename
export async function loadTransition(filename: string): Promise<Transition> {
  console.log(`Fetching transition from: /data/${filename}`);
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      const error = `Failed to load transition: ${filename} - ${response.status} ${response.statusText}`;
      console.error(error);
      throw new Error(error);
    }
    const data = await response.json() as Transition;
    console.log(`Transition ${filename} loaded successfully:`, data);
    return data;
  } catch (error) {
    console.error(`Error loading transition ${filename}:`, error);
    throw error;
  }
}

// For backward compatibility with existing code
// Import the full slideshow data (will be removed once incremental loading is fully implemented)
import slideshowDataJson from '../data/slideshow.json';
export const slideshowData: SlideshowData = slideshowDataJson as SlideshowData;

// In a real implementation, we would load this data from the JSON file
// For example:
// import slideshowDataJson from '/path/to/slideshow.json';
// export const slideshowData: SlideshowData = slideshowDataJson; 