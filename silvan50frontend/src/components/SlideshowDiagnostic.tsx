"use client";

import { useEffect, useState } from 'react';
import { 
  SlideshowManifest,
  Slide,
  loadSlideshowManifest,
  loadSlide
} from '../utils/slideshow-data';

export default function SlideshowDiagnostic() {
  const [manifest, setManifest] = useState<SlideshowManifest | null>(null);
  const [firstSlide, setFirstSlide] = useState<Slide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load manifest
        console.log("Loading manifest...");
        const manifestData = await loadSlideshowManifest();
        setManifest(manifestData);
        
        if (manifestData.slides.length > 0) {
          // Load first slide
          const slideInfo = manifestData.slides[0];
          console.log("Loading first slide:", slideInfo);
          const slideData = await loadSlide(slideInfo.filename);
          setFirstSlide(slideData);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (loading) {
    return <div className="p-4 bg-slate-900 text-white min-h-screen">
      <h1 className="text-xl mb-4">Slideshow Diagnostic - Loading...</h1>
    </div>;
  }

  if (error) {
    return <div className="p-4 bg-slate-900 text-white min-h-screen">
      <h1 className="text-xl mb-4">Slideshow Diagnostic - Error</h1>
      <div className="p-2 border border-red-500 bg-red-900 rounded">
        {error}
      </div>
    </div>;
  }

  return (
    <div className="p-4 bg-slate-900 text-white min-h-screen">
      <h1 className="text-xl mb-4">Slideshow Diagnostic</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">Manifest</h2>
        {manifest ? (
          <div>
            <p>Total slides: {manifest.total_slides}</p>
            <p>Slides in manifest: {manifest.slides.length}</p>
            
            <div className="mt-2">
              <h3 className="font-bold">Slide List:</h3>
              <ul className="list-disc pl-5">
                {manifest.slides.map(slide => (
                  <li key={slide.index}>
                    #{slide.index}: {slide.name} ({slide.filename}) - 
                    {slide.transitions.length} transitions
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p>No manifest loaded</p>
        )}
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">First Slide</h2>
        {firstSlide ? (
          <div>
            <p>Name: {firstSlide.name}</p>
            <p>Triangles: {firstSlide.triangles.length}</p>
            
            {firstSlide.triangles.length > 0 && (
              <div className="mt-2">
                <h3 className="font-bold">First Triangle:</h3>
                <pre className="bg-slate-800 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(firstSlide.triangles[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p>No slide loaded</p>
        )}
      </div>
      
      <div className="p-2 border border-yellow-500 bg-yellow-900 rounded">
        <p>Check browser console for detailed logs.</p>
      </div>
    </div>
  );
} 