export interface Triangle {
  coordinates: [number, number][];
  color: [number, number, number];
  opacity?: number;
}

export interface Slide {
  triangles: Triangle[];
  name: string;
  image_path?: string;
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
  dominant_colors: string[];
  transitions: SlideTransition[];
  image_path?: string;
  description?: string;
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
    
    // The raw transition data is an array of pairings without a wrapper object
    const pairingsArray = await response.json();
    
    // Create a proper Transition object with the pairings array
    // Extract from and to indices from the filename (e.g., transition_0_to_1.json)
    const matches = filename.match(/transition_(\d+)_to_(\d+)/);
    if (!matches) {
      throw new Error(`Invalid transition filename format: ${filename}`);
    }
    
    const from = parseInt(matches[1], 10);
    const to = parseInt(matches[2], 10);
    
    // Create the proper transition object
    const transition: Transition = {
      from,
      to,
      pairings: pairingsArray
    };
    
    console.log(`Transition ${filename} loaded successfully:`, transition);
    return transition;
  } catch (error) {
    console.error(`Error loading transition ${filename}:`, error);
    throw error;
  }
}


// In a real implementation, we would load this data from the JSON file
// For example:
// import slideshowDataJson from '/path/to/slideshow.json';
// export const slideshowData: SlideshowData = slideshowDataJson; 