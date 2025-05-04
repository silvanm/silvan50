"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { 
  slideshowData, 
  Triangle, 
  Slide, 
  Transition,
  Pairing 
} from '../utils/slideshow-data';

const TRANSITION_DURATION = 2; // seconds
const SLIDE_DISPLAY_DURATION = 1; // seconds to display each slide before transitioning

export default function Slideshow() {
  const svgRef = useRef<SVGSVGElement>(null);
  const slideNameRef = useRef<HTMLDivElement>(null);
  // Use refs instead of state to avoid re-renders
  const currentSlideIndexRef = useRef(0);
  const nextSlideIndexRef = useRef(1);

  // Function to convert RGB array to CSS color string
  const rgbToString = (rgb: [number, number, number], opacity = 1) => {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
  };

  // Get next slide index in a loop
  const getNextSlideIndex = (current: number) => {
    const nextIndex = (current + 1) % slideshowData.slides.length;
    console.log(`Moving from slide ${current} to slide ${nextIndex}`);
    return nextIndex;
  };

  // Function to update slide name without re-rendering triangles
  const updateSlideName = (name: string) => {
    if (slideNameRef.current) {
      slideNameRef.current.textContent = name;
    }
  };

  // Log the data when component mounts to verify it's loaded
  useEffect(() => {
    console.log('Slideshow mounted, data loaded:', {
      slides: slideshowData.slides.length,
      transitions: slideshowData.transitions.length
    });
    
    // Log detailed info about each slide
    slideshowData.slides.forEach((slide, index) => {
      console.log(`Slide ${index} (${slide.name}):`, {
        triangleCount: slide.triangles.length,
        triangles: slide.triangles.map((t, i) => ({
          index: i,
          coordinates: t.coordinates,
          color: t.color
        }))
      });
    });
    
    // Log detailed info about transitions
    slideshowData.transitions.forEach((transition, index) => {
      console.log(`Transition ${index} (${transition.from} → ${transition.to}):`, {
        pairingCount: transition.pairings.length,
        pairings: transition.pairings
      });
    });

    // Initialize with first slide
    renderInitialTriangles();
    
    // Set up non-reactive animation cycle
    setupAnimationCycle();
    
  }, []);

  // Render initial triangles once
  const renderInitialTriangles = () => {
    if (!svgRef.current) {
      console.warn('SVG ref not available');
      return;
    }
    
    const currentSlideIndex = currentSlideIndexRef.current;
    const currentSlide = slideshowData.slides[currentSlideIndex];
    
    console.log(`Rendering initial triangles for slide ${currentSlideIndex}: "${currentSlide.name}"`);
    
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
      
      svg.appendChild(polygonElement);
    });
    
    // Set initial slide name
    updateSlideName(currentSlide.name);
  };

  // Set up animation cycle that doesn't cause re-renders
  const setupAnimationCycle = () => {
    const animationTimer = setInterval(() => {
      const currentIdx = currentSlideIndexRef.current;
      const nextIdx = nextSlideIndexRef.current;
      
      // Find transition
      const transition = slideshowData.transitions.find(
        (t: Transition) => t.from === currentIdx && t.to === nextIdx
      );
      
      // Animate
      if (transition) {
        console.log(`Found transition for ${currentIdx} → ${nextIdx}:`, transition);
        animateTransition(
          transition, 
          slideshowData.slides[currentIdx], 
          slideshowData.slides[nextIdx]
        );
      } else {
        console.warn(`No transition found for ${currentIdx} → ${nextIdx}`);
      }
      
      // Update refs after animation completes
      setTimeout(() => {
        const newNextIdx = getNextSlideIndex(nextIdx);
        currentSlideIndexRef.current = nextIdx;
        nextSlideIndexRef.current = newNextIdx;
        // Update slide name without re-rendering triangles
        updateSlideName(slideshowData.slides[nextIdx].name);
        console.log(`Updated indices: current=${nextIdx}, next=${newNextIdx}`);
      }, TRANSITION_DURATION * 1000);
    }, (TRANSITION_DURATION + SLIDE_DISPLAY_DURATION) * 1000);
    
    console.log(`Animation cycle set for ${TRANSITION_DURATION + SLIDE_DISPLAY_DURATION} seconds`);
    
    // Cleanup on unmount
    return () => {
      console.log('Clearing animation timer');
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
    
    console.log(`Starting animation from "${fromSlide.name}" to "${toSlide.name}"`);
    console.log(`Animation will take ${TRANSITION_DURATION} seconds`);
    
    const svg = svgRef.current;
    const triangleElements = svg.querySelectorAll('.triangle');
    
    console.log(`Found ${triangleElements.length} triangle elements in the DOM`);
    
    // Create a GSAP timeline for the transition
    const tl = gsap.timeline({
      onStart: () => console.log('GSAP animation started'),
      onComplete: () => console.log('GSAP animation completed'),
    });
    
    transition.pairings.forEach((pairing: Pairing, idx: number) => {
      const toTriangle = toSlide.triangles[pairing.to_index];
      const triangleElement = triangleElements[pairing.from_index];
      
      if (!triangleElement) {
        console.warn(`Triangle element not found for pairing ${idx}:`, pairing);
        return;
      }
      
      const fromTriangle = fromSlide.triangles[pairing.from_index];
      
      // Calculate target points for the triangle
      const sourcePoints = fromTriangle.coordinates
        .map((coord: [number, number]) => `${coord[0]},${coord[1]}`)
        .join(' ');
        
      const targetPoints = toTriangle.coordinates
        .map((coord: [number, number]) => `${coord[0]},${coord[1]}`)
        .join(' ');
      
      // Calculate colors
      const sourceColor = rgbToString(fromTriangle.color, fromTriangle.opacity ?? 1);
      const targetColor = rgbToString(toTriangle.color, toTriangle.opacity ?? 1);
      
      console.log(`Pairing ${idx}: Triangle ${pairing.from_index} → ${pairing.to_index}`, {
        sourcePoints,
        targetPoints,
        sourceColor,
        targetColor,
        distance: pairing.distance
      });
      
      // Add to timeline
      tl.to(
        triangleElement,
        {
          attr: { points: targetPoints },
          fill: targetColor,
          duration: TRANSITION_DURATION,
          ease: "power2.inOut",
          onStart: () => console.log(`Animation started for triangle ${pairing.from_index}`),
          onComplete: () => console.log(`Animation completed for triangle ${pairing.from_index}`)
        },
        0 // Start all animations at the same time
      );
    });
  };

  return (
    <div className="slideshow-container">
      <svg
        ref={svgRef}
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      />
      <div ref={slideNameRef} className="slide-name"></div>
    </div>
  );
} 