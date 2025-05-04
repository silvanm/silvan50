import fs from 'fs';
import path from 'path';
import { SlideshowData } from '../utils/slideshow-data';

// This function can be used in Next.js data fetching functions
// such as getStaticProps or in API routes
export async function loadFullSlideshowData(): Promise<SlideshowData> {
  try {
    // Read the JSON file from the provided path
    const filePath = path.join(process.cwd(), '..', 'test_output', 'slideshow.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    
    // Parse the JSON data
    const data = JSON.parse(fileContents) as SlideshowData;
    return data;
  } catch (error) {
    console.error('Error loading slideshow data:', error);
    // Return a minimal data structure in case of error
    return {
      slides: [],
      transitions: []
    };
  }
} 