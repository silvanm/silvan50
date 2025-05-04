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

export interface SlideshowData {
  slides: Slide[];
  transitions: Transition[];
}

// Import the slideshow data
import slideshowDataJson from '../data/slideshow.json';

// Export the data with proper type
export const slideshowData: SlideshowData = slideshowDataJson as SlideshowData;

// In a real implementation, we would load this data from the JSON file
// For example:
// import slideshowDataJson from '/path/to/slideshow.json';
// export const slideshowData: SlideshowData = slideshowDataJson; 