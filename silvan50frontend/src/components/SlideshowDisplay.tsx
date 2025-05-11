"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  Triangle,
  Slide,
  Transition,
  Pairing,
  SlideshowManifest,
  loadSlideshowManifest,
  loadSlide,
  loadTransition,
} from "../utils/slideshow-data";

const TRANSITION_DURATION = 5; // seconds
const SLIDE_DISPLAY_DURATION = 7; // seconds to display each slide before transitioning
const MAX_TRIANGLE_DELAY = 4; // maximum delay in seconds for triangle animations based on position
const PRELOAD_SLIDES = 2; // Number of slides to preload ahead

interface SlideshowDisplayProps {
  onDominantColorsChange: (colors: string[]) => void;
  onFirstTransitionStart?: () => void;
}

export default function Slideshow({ onDominantColorsChange, onFirstTransitionStart }: SlideshowDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const slideNameRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid re-renders
  const currentSlideIndexRef = useRef(0);
  const nextSlideIndexRef = useRef(1);

  // Store loaded data and state
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const wasManuallyPausedRef = useRef(false); // Added to track if pause was user-initiated

  const manifestRef = useRef<SlideshowManifest | null>(null);
  const loadedSlidesRef = useRef<Map<number, Slide>>(new Map());
  const loadedTransitionsRef = useRef<Map<string, Transition>>(new Map());
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null); // For the main interval
  const postTransitionUpdateTimerRef = useRef<NodeJS.Timeout | null>(null); // For updates after a single transition
  const hasFirstTransitionStartedRef = useRef(false);

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

  // Toggle pause state
  const togglePause = () => {
    const newPauseState = !isPaused;
    wasManuallyPausedRef.current = newPauseState; // Update based on new state before setting it
    setIsPaused(newPauseState);
  };

  // Core logic for one transition cycle
  const advanceSlideAndAnimate = async () => {
    // If this function can be called when isPaused is true from an external source,
    // add a check: if (isPaused) return;

    const currentIdx = currentSlideIndexRef.current;
    const targetSlideIdx = nextSlideIndexRef.current;

    const currentSlide = loadedSlidesRef.current.get(currentIdx);
    let targetSlide = loadedSlidesRef.current.get(targetSlideIdx);

    if (!targetSlide) {
      console.warn(`Target slide ${targetSlideIdx} not preloaded for advanceSlideAndAnimate. Loading now...`);
      await loadSlideData(targetSlideIdx);
      targetSlide = loadedSlidesRef.current.get(targetSlideIdx);
    }

    if (!currentSlide || !targetSlide) {
      console.error(
        `Cannot animate: Current slide ${currentIdx} or target slide ${targetSlideIdx} not loaded after attempt.`
      );
      // Potentially try to recover or stop the slideshow
      return;
    }

    // Update dominant colors for the TARGET slide (before transition)
    if (manifestRef.current) {
      const targetSlideInfo = manifestRef.current.slides.find(
        (s) => s.index === targetSlideIdx
      );
      if (
        targetSlideInfo &&
        targetSlideInfo.dominant_colors &&
        targetSlideInfo.dominant_colors.length > 0
      ) {
        onDominantColorsChange(targetSlideInfo.dominant_colors);
      }
    }

    const transitionKey = `${currentIdx}_to_${targetSlideIdx}`;
    const transition = loadedTransitionsRef.current.get(transitionKey);

    if (transition) {
      animateTransition(transition, currentSlide, targetSlide); // This calls onFirstTransitionStart
    } else {
      console.warn(`No transition found for ${currentIdx} → ${targetSlideIdx}. Snapping content.`);
      updateSlideName(targetSlide.name); // Colors already changed, update name
    }

    // Clear any existing post-transition timer
    if (postTransitionUpdateTimerRef.current) {
      clearTimeout(postTransitionUpdateTimerRef.current);
    }

    // This timeout is for tasks after the transition animation finishes
    postTransitionUpdateTimerRef.current = setTimeout(async () => {
      currentSlideIndexRef.current = targetSlideIdx;
      const newNextSlideIdx = getNextSlideIndex(targetSlideIdx);
      nextSlideIndexRef.current = newNextSlideIdx;

      // Update slide name for the slide we just transitioned TO (if there was a transition)
      // If no transition, name was updated above.
      if (transition) {
          updateSlideName(targetSlide.name);
      }

      // Preload the next-next slide
      if (!loadedSlidesRef.current.has(newNextSlideIdx)) {
        await loadSlideData(newNextSlideIdx);
      }
      postTransitionUpdateTimerRef.current = null; // Clear ref after execution
    }, TRANSITION_DURATION * 1000);
  };
  
  // Set up the recurring animation cycle
  const setupAnimationCycle = () => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }
    animationTimerRef.current = setInterval(async () => {
      if (isPaused) return; // Check current pause state
      await advanceSlideAndAnimate();
    }, (TRANSITION_DURATION + SLIDE_DISPLAY_DURATION) * 1000);
  };

  // Load the initial manifest and first slide
  useEffect(() => {
    const initializeSlideshow = async () => {
      try {
        setIsLoading(true);
        console.log("Initializing slideshow...");

        const manifest = await loadSlideshowManifest();
        manifestRef.current = manifest;

        if (manifest.slides.length === 0) {
          setErrorMessage("No slides found in manifest");
          setIsLoading(false);
          return;
        }

        if (
          manifest.slides[0].dominant_colors &&
          manifest.slides[0].dominant_colors.length > 0
        ) {
          onDominantColorsChange(manifest.slides[0].dominant_colors);
        }

        await loadSlideData(0); // Load slide 0

        // Preload the next few slides (e.g., slide 1 for the first immediate transition)
        for (let i = 1; i <= PRELOAD_SLIDES; i++) {
          const preloadIndex = i % manifest.total_slides;
          if (preloadIndex === 0 && manifest.total_slides > 1) continue; // Avoid preloading 0 if it's the current
          if (!loadedSlidesRef.current.has(preloadIndex)) {
            await loadSlideData(preloadIndex);
          }
        }
        
        console.log("Rendering initial triangles for slide 0...");
        renderInitialTriangles(); // Display slide 0

        // Immediately start the first transition
        console.log("Performing first transition cycle immediately (0 -> 1)...");
        await advanceSlideAndAnimate(); 

        // Set up the regular animation cycle for subsequent slides
        console.log("Setting up regular animation cycle for subsequent slides...");
        setupAnimationCycle(); // Schedules 1 -> 2 and onwards

        setIsLoading(false);
        console.log("Slideshow initialization complete");
      } catch (error) {
        console.error("Failed to initialize slideshow:", error);
        setErrorMessage(
          `Failed to load slideshow data: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        setIsLoading(false);
      }
    };

    initializeSlideshow();

    return () => {
      // Cleanup timers on unmount
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
      if (postTransitionUpdateTimerRef.current) {
        clearTimeout(postTransitionUpdateTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  // Render initial triangles once data is loaded
  const renderInitialTriangles = () => {
    console.log("Attempting to render initial triangles...");

    if (!svgRef.current) {
      console.error(
        "Cannot render triangles: SVG ref not available. This might happen if the component is not fully mounted."
      );
      return;
    }

    const currentSlideIndex = currentSlideIndexRef.current;
    console.log(`Current slide index: ${currentSlideIndex}`);

    const currentSlide = loadedSlidesRef.current.get(currentSlideIndex);

    if (!currentSlide) {
      console.error(
        `Failed to render: Slide ${currentSlideIndex} not loaded or not found in loadedSlidesRef.`
      );
      console.log(
        "Available slides:",
        Array.from(loadedSlidesRef.current.keys())
      );
      return;
    }

    console.log(
      `Rendering slide ${currentSlideIndex} with ${currentSlide.triangles.length} triangles`
    );

    // Clear any existing triangles
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Create and append triangles
    currentSlide.triangles.forEach((triangle: Triangle, index: number) => {
      const points = triangle.coordinates
        .map((coord: [number, number]) => `${coord[0]},${coord[1]}`)
        .join(" ");

      const color = rgbToString(triangle.color, triangle.opacity ?? 1);

      const polygonElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polygon"
      );
      polygonElement.setAttribute("class", "triangle");
      polygonElement.setAttribute("points", points);
      polygonElement.setAttribute("fill", color);
      polygonElement.dataset.index = index.toString();
      polygonElement.id = `triangle-${index}`; // Add a unique ID to each triangle

      svg.appendChild(polygonElement);
    });

    // Set initial slide name
    updateSlideName(currentSlide.name);
    console.log(
      `Rendered ${currentSlide.triangles.length} triangles for slide "${currentSlide.name}"`
    );
  };

  // Function to animate the transition between slides
  const animateTransition = (
    transition: Transition,
    fromSlide: Slide,
    toSlide: Slide
  ) => {
    if (!svgRef.current) {
      console.warn("Cannot animate: SVG ref not available");
      return;
    }

    // Signal that the first transition has started, if it hasn't already
    if (onFirstTransitionStart && !hasFirstTransitionStartedRef.current) {
      onFirstTransitionStart();
      hasFirstTransitionStartedRef.current = true;
      console.log("First transition started, callback invoked.");
    }

    const svg = svgRef.current;

    // Create a GSAP timeline for the transition
    const tl = gsap.timeline({});

    // Find the maximum y-coordinate in the entire slide for normalization
    let maxY = 0;
    fromSlide.triangles.forEach((triangle) => {
      triangle.coordinates.forEach((coord) => {
        if (coord[1] > maxY) maxY = coord[1];
      });
    });

    transition.pairings.forEach((pairing: Pairing, idx: number) => {
      const toTriangle = toSlide.triangles[pairing.to_index];
      // Select triangle by ID instead of by DOM order
      const triangleElement = svg.querySelector(
        `#triangle-${pairing.from_index}`
      );

      if (!triangleElement) {
        console.warn(`Triangle element not found for pairing ${idx}:`, pairing);
        return;
      }

      // Check if the destination triangle has opacity 0
      const toOpacity = toTriangle.opacity ?? 1;

      // Calculate target points for the triangle
      const targetPoints = toTriangle.coordinates
        .map((coord: [number, number]) => `${coord[0]},${coord[1]}`)
        .join(" ");

      // Calculate colors
      const targetColor = rgbToString(toTriangle.color, toOpacity);

      // Calculate delay based on vertical position
      // Get the source triangle data to calculate position
      const sourceTriangle = fromSlide.triangles[pairing.from_index];

      // Calculate average y-coordinate of the triangle
      const avgY =
        sourceTriangle.coordinates.reduce((sum, coord) => sum + coord[1], 0) /
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
            },
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
            },
          },
          0 // Start all animations at the same time
        );
      }
    });
  };

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

    const slideInfo = manifest.slides.find((s) => s.index === slideIndex);
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
          console.log(
            `Loading transition from ${slideIndex} to ${transition.to} from ${transition.filename}...`
          );
          const transitionData = await loadTransition(transition.filename);
          console.log(`Transition ${transitionKey} loaded:`, transitionData);
          loadedTransitionsRef.current.set(transitionKey, transitionData);
        }
      }
    } catch (error) {
      console.error(`Failed to load slide ${slideIndex}:`, error);
    }
  };

  // Show loading or error state
  if (isLoading) {
    return (
      <div
        className="slideshow-loading flex justify-center items-center bg-black text-white w-full h-full"
      >
        Loading slideshow...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        className="slideshow-error flex justify-center items-center bg-black text-red-500 w-full h-full"
      >
        Error: {errorMessage}
      </div>
    );
  }

  return (
    <div
      className="slideshow-container w-full h-full overflow-hidden relative bg-black"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1000 800"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full absolute top-0 left-0 object-cover"
      />
      <div
        ref={slideNameRef}
        className="slide-name absolute bottom-8 left-8 z-10 text-white"
      ></div>
      {/* Debug Panel */}
      <div
        className="debug-panel absolute bottom-8 right-8 z-20 bg-black bg-opacity-70 p-2 rounded-lg flex flex-col gap-2"
      >
        <button
          onClick={togglePause}
          className={`font-bold text-white border-none py-2 px-4 rounded cursor-pointer ${isPaused ? "bg-green-500" : "bg-red-500"}`}
        >
          {isPaused ? "Play" : "Pause"}
        </button>
        <div className="text-white text-xs">
          Current Slide: {currentSlideIndexRef.current}
        </div>
      </div>
    </div>
  );
}
