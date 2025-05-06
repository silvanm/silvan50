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

const TRANSITION_DURATION = 5; // seconds
const SLIDE_DISPLAY_DURATION = 7; // seconds to display each slide before transitioning
const MAX_TRIANGLE_DELAY = 4 ; // maximum delay in seconds for triangle animations based on position

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
    // Initialize with first slide
    renderInitialTriangles();
    
    // Set up non-reactive animation cycle
    setupAnimationCycle();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render initial triangles once
  const renderInitialTriangles = () => {
    if (!svgRef.current) {
      console.warn('SVG ref not available');
      return;
    }
    
    const currentSlideIndex = currentSlideIndexRef.current;
    const currentSlide = slideshowData.slides[currentSlideIndex];
    
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
        }}
      ></div>
    </div>
  );
} 