"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { 
  Triangle, 
  Slide, 
  Transition,
  Pairing,
  SlideshowManifest,
  loadSlideshowManifest,
  loadSlide,
  loadTransition
} from '../utils/slideshow-data';

const TRANSITION_DURATION = 5; // seconds
const SLIDE_DISPLAY_DURATION = 7; // seconds to display each slide before transitioning
const MAX_TRIANGLE_DELAY = 4; // maximum delay in seconds for triangle animations based on position
const PRELOAD_SLIDES = 2; // Number of slides to preload ahead

export default function Slideshow() {
  const svgRef = useRef<SVGSVGElement>(null);
  const slideNameRef = useRef<HTMLDivElement>(null);
  
  // Use refs to avoid re-renders
  const currentSlideIndexRef = useRef(0);
  const nextSlideIndexRef = useRef(1);
  
  // Store loaded data and state
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const manifestRef = useRef<SlideshowManifest | null>(null);
  const loadedSlidesRef = useRef<Map<number, Slide>>(new Map());
  const loadedTransitionsRef = useRef<Map<string, Transition>>(new Map());
  
  // Function to convert RGB array to CSS color string
  const rgbToString = (rgb: [number, number, number], opacity = 1) => {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
  };

  // Get next slide index in a loop
  const getNextSlideIndex = (current: number) => {
    const totalSlides = manifestRef.current?.total_slides || 0;
    if (totalSlides === 0) return 0;
    return (current + 1) % totalSlides;
  };

  // Function to update slide name without re-rendering triangles
  const updateSlideName = (name: string) => {
    if (slideNameRef.current) {
      slideNameRef.current.textContent = name;
    }
  };
  
  // Load the initial manifest and first slide
  useEffect(() => {
    const initializeSlideshow = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing slideshow...");
        
        // Load the manifest
        console.log("Loading manifest...");
        const manifest = await loadSlideshowManifest();
        console.log("Manifest loaded:", manifest);
        manifestRef.current = manifest;
        
        if (manifest.slides.length === 0) {
          console.error("No slides found in manifest");
          setErrorMessage("No slides found in manifest");
          setIsLoading(false);
          return;
        }
        
        // Load the first slide
        console.log("Loading first slide (index 0)...");
        await loadSlideData(0);
        console.log("First slide loaded:", loadedSlidesRef.current.get(0));
        
        // Preload the next few slides
        for (let i = 1; i <= PRELOAD_SLIDES; i++) {
          const preloadIndex = i % manifest.total_slides;
          console.log(`Preloading slide ${preloadIndex}...`);
          loadSlideData(preloadIndex);
        }
        
        // Do NOT render triangles here - we'll do it in a separate useEffect
        
        // Set up animation cycle
        console.log("Setting up animation cycle...");
        setupAnimationCycle();
        
        setIsLoading(false);
        console.log("Slideshow initialization complete");
      } catch (error) {
        console.error("Failed to initialize slideshow:", error);
        setErrorMessage(`Failed to load slideshow data: ${error instanceof Error ? error.message : String(error)}`);
        setIsLoading(false);
      }
    };
    
    initializeSlideshow();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Separate useEffect to render triangles after component mounts and data is loaded
  useEffect(() => {
    // Only proceed if loading is complete and SVG ref is available
    if (!isLoading && svgRef.current && loadedSlidesRef.current.has(currentSlideIndexRef.current)) {
      console.log("Component mounted with SVG ref, rendering triangles...");
      renderInitialTriangles();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]); // Only depend on isLoading and disable the exhaustive-deps warning
  
  // Load a slide and its transitions
  const loadSlideData = async (slideIndex: number) => {
    // Don't load if already loaded
    if (loadedSlidesRef.current.has(slideIndex)) {
      console.log(`Slide ${slideIndex} already loaded, skipping`);
      return;
    }
    
    const manifest = manifestRef.current;
    if (!manifest) {
      console.error("Cannot load slide: Manifest not loaded");
      return;
    }
    
    const slideInfo = manifest.slides.find(s => s.index === slideIndex);
    if (!slideInfo) {
      console.error(`Slide ${slideIndex} not found in manifest`);
      return;
    }
    
    try {
      // Load the slide
      console.log(`Loading slide ${slideIndex} from ${slideInfo.filename}...`);
      const slide = await loadSlide(slideInfo.filename);
      console.log(`Slide ${slideIndex} loaded:`, slide);
      loadedSlidesRef.current.set(slideIndex, slide);
      
      // Load all transitions for this slide
      for (const transition of slideInfo.transitions) {
        // Create a unique key for this transition
        const transitionKey = `${slideIndex}_to_${transition.to}`;
        
        // Load only if not already loaded
        if (!loadedTransitionsRef.current.has(transitionKey)) {
          console.log(`Loading transition from ${slideIndex} to ${transition.to} from ${transition.filename}...`);
          const transitionData = await loadTransition(transition.filename);
          console.log(`Transition ${transitionKey} loaded:`, transitionData);
          loadedTransitionsRef.current.set(transitionKey, transitionData);
        }
      }
    } catch (error) {
      console.error(`Failed to load slide ${slideIndex}:`, error);
    }
  };

  // Render initial triangles once data is loaded
  const renderInitialTriangles = () => {
    console.log("Attempting to render initial triangles...");
    
    if (!svgRef.current) {
      console.error('Cannot render triangles: SVG ref not available. This might happen if the component is not fully mounted.');
      return;
    }
    
    const currentSlideIndex = currentSlideIndexRef.current;
    console.log(`Current slide index: ${currentSlideIndex}`);
    
    const currentSlide = loadedSlidesRef.current.get(currentSlideIndex);
    
    if (!currentSlide) {
      console.error(`Failed to render: Slide ${currentSlideIndex} not loaded or not found in loadedSlidesRef.`);
      console.log("Available slides:", Array.from(loadedSlidesRef.current.keys()));
      return;
    }
    
    console.log(`Rendering slide ${currentSlideIndex} with ${currentSlide.triangles.length} triangles`);
    
    // Clear any existing triangles
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    
    // Create and append triangles
    currentSlide.triangles.forEach((triangle: Triangle, index: number) => {
      const points = triangle.coordinates
        .map((coord: [number, number]) => `${coord[0]},${coord[1]}`)
        .join(' ');
      
      const color = rgbToString(triangle.color, triangle.opacity ?? 1);
      
      const polygonElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygonElement.setAttribute("class", "triangle");
      polygonElement.setAttribute("points", points);
      polygonElement.setAttribute("fill", color);
      polygonElement.dataset.index = index.toString();
      polygonElement.id = `triangle-${index}`; // Add a unique ID to each triangle
      
      svg.appendChild(polygonElement);
    });
    
    // Set initial slide name
    updateSlideName(currentSlide.name);
    console.log(`Rendered ${currentSlide.triangles.length} triangles for slide "${currentSlide.name}"`);
  };

  // Set up animation cycle that doesn't cause re-renders
  const setupAnimationCycle = () => {
    const animationTimer = setInterval(async () => {
      const currentIdx = currentSlideIndexRef.current;
      const nextIdx = nextSlideIndexRef.current;
      
      // Ensure both slides are loaded
      if (!loadedSlidesRef.current.has(currentIdx) || !loadedSlidesRef.current.has(nextIdx)) {
        console.warn(`Cannot animate: Slides ${currentIdx} or ${nextIdx} not loaded`);
        return;
      }
      
      // Find transition
      const transitionKey = `${currentIdx}_to_${nextIdx}`;
      const transition = loadedTransitionsRef.current.get(transitionKey);
      
      // Animate if transition exists
      if (transition) {
        animateTransition(
          transition, 
          loadedSlidesRef.current.get(currentIdx)!, 
          loadedSlidesRef.current.get(nextIdx)!
        );
      } else {
        console.warn(`No transition found for ${currentIdx} → ${nextIdx}`);
      }
      
      // Update refs after animation completes
      setTimeout(async () => {
        const newNextIdx = getNextSlideIndex(nextIdx);
        currentSlideIndexRef.current = nextIdx;
        nextSlideIndexRef.current = newNextIdx;
        
        // Update slide name without re-rendering triangles
        const nextSlide = loadedSlidesRef.current.get(nextIdx);
        if (nextSlide) {
          updateSlideName(nextSlide.name);
        }
        
        // Preload next slide if not already loaded
        if (!loadedSlidesRef.current.has(newNextIdx)) {
          await loadSlideData(newNextIdx);
        }
      }, TRANSITION_DURATION * 1000);
    }, (TRANSITION_DURATION + SLIDE_DISPLAY_DURATION) * 1000);
    
    // Cleanup on unmount
    return () => {
      clearInterval(animationTimer);
    };
  };

  // Function to animate the transition between slides
  const animateTransition = (
    transition: Transition, 
    fromSlide: Slide, 
    toSlide: Slide
  ) => {
    if (!svgRef.current) {
      console.warn('Cannot animate: SVG ref not available');
      return;
    }
    
    const svg = svgRef.current;
    
    // Create a GSAP timeline for the transition
    const tl = gsap.timeline({});
    
    // Find the maximum y-coordinate in the entire slide for normalization
    let maxY = 0;
    fromSlide.triangles.forEach(triangle => {
      triangle.coordinates.forEach(coord => {
        if (coord[1] > maxY) maxY = coord[1];
      });
    });
    
    transition.pairings.forEach((pairing: Pairing, idx: number) => {
      const toTriangle = toSlide.triangles[pairing.to_index];
      // Select triangle by ID instead of by DOM order
      const triangleElement = svg.querySelector(`#triangle-${pairing.from_index}`);
      
      if (!triangleElement) {
        console.warn(`Triangle element not found for pairing ${idx}:`, pairing);
        return;
      }
      
      // Check if the destination triangle has opacity 0
      const toOpacity = toTriangle.opacity ?? 1;
      
      // Calculate target points for the triangle
      const targetPoints = toTriangle.coordinates
        .map((coord: [number, number]) => `${coord[0]},${coord[1]}`)
        .join(' ');
      
      // Calculate colors
      const targetColor = rgbToString(toTriangle.color, toOpacity);
      
      // Calculate delay based on vertical position
      // Get the source triangle data to calculate position
      const sourceTriangle = fromSlide.triangles[pairing.from_index];
      
      // Calculate average y-coordinate of the triangle
      const avgY = sourceTriangle.coordinates.reduce((sum, coord) => sum + coord[1], 0) / 
                  sourceTriangle.coordinates.length;
      
      // Normalize the position to get a delay between 0 and MAX_TRIANGLE_DELAY seconds
      // The higher the y value, the later the animation starts
      const delay = (avgY / maxY) * MAX_TRIANGLE_DELAY;
      
      // Add to timeline - handle triangles with opacity 0 differently
      if (toOpacity === 0) {
        // For triangles that should become invisible, only transition the opacity
        tl.to(
          triangleElement,
          {
            fill: targetColor, // This includes the opacity change
            duration: TRANSITION_DURATION,
            ease: "power2.inOut",
            delay: delay,
            onComplete: () => {
              // Update triangle ID to match its new index in the next slide
              triangleElement.id = `triangle-${pairing.to_index}`;
            }
          },
          0 // Start all animations at the same time
        );
      } else {
        // For normal triangles, animate both position and color
        tl.to(
          triangleElement,
          {
            attr: { points: targetPoints },
            fill: targetColor,
            duration: TRANSITION_DURATION,
            ease: "power2.inOut",
            delay: delay,
            onComplete: () => {
              // Update triangle ID to match its new index in the next slide
              triangleElement.id = `triangle-${pairing.to_index}`;
            }
          },
          0 // Start all animations at the same time
        );
      }
    });
  };

  // Show loading or error state
  if (isLoading) {
    return (
      <div className="slideshow-loading" style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        color: 'white'
      }}>
        Loading slideshow...
      </div>
    );
  }
  
  if (errorMessage) {
    return (
      <div className="slideshow-error" style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
        color: 'red'
      }}>
        Error: {errorMessage}
      </div>
    );
  }

  return (
    <div className="slideshow-container" style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: 'black'
    }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      <div 
        ref={slideNameRef} 
        className="slide-name"
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '2rem',
          zIndex: 10,
          color: 'white'
        }}
      ></div>
    </div>
  );
} 