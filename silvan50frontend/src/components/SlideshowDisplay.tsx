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
const ICON_SIZE = 24; // Size of the info icon in pixels

interface SlideshowDisplayProps {
  onDominantColorsChange: (colors: string[]) => void;
}

export default function Slideshow({ onDominantColorsChange }: SlideshowDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const slideNameRef = useRef<HTMLDivElement>(null);

  // Use refs to avoid re-renders
  const currentSlideIndexRef = useRef(0);
  const nextSlideIndexRef = useRef(1);

  // Store loaded data and state
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [svgReady, setSvgReady] = useState(false); // Track if SVG is ready
  const [isDebugMode, setIsDebugMode] = useState(false); // Track debug mode
  
  // Added for thumbnail functionality
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  
  // Use a ref for the pause state to avoid closure issues in intervals
  const isPausedRef = useRef(false);
  const wasManuallyPausedRef = useRef(false); // Added to track if pause was user-initiated

  const manifestRef = useRef<SlideshowManifest | null>(null);
  const loadedSlidesRef = useRef<Map<number, Slide>>(new Map());
  const loadedTransitionsRef = useRef<Map<string, Transition>>(new Map());
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null); // For the main interval
  const postTransitionUpdateTimerRef = useRef<NodeJS.Timeout | null>(null); // For updates after a single transition

  // Sync state with ref
  useEffect(() => {
    console.log(`[State] isPaused state changed to: ${isPaused}`);
    isPausedRef.current = isPaused;
    
    // Handle animation timer based on pause state
    if (isPaused) {
      // If paused, clear any existing timer
      if (animationTimerRef.current) {
        console.log("[State] Clearing animation timer because slideshow is paused");
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    } else {
      // If unpaused and no timer is running, start one
      if (!animationTimerRef.current) {
        console.log("[State] Starting animation timer because slideshow is unpaused");
        setupAnimationCycle();
      }
    }
  }, [isPaused]);

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
    console.log(`[Pause] Button clicked - current pause state: ${isPaused}`);
    const newPauseState = !isPaused;
    
    // Update manual pause flag
    wasManuallyPausedRef.current = newPauseState;
    console.log(`[Pause] Manually ${newPauseState ? 'pausing' : 'resuming'} slideshow (wasManuallyPaused: ${wasManuallyPausedRef.current})`);
    
    // Update state - the effect will handle timer management
    setIsPaused(newPauseState);
  };
  
  // Update the current image path and dominant color for the thumbnail
  const updateCurrentImagePath = (slideIndex: number) => {
    const manifest = manifestRef.current;
    if (!manifest) return;

    const slideInfo = manifest.slides.find(s => s.index === slideIndex);
    if (slideInfo) {
      // Set image path
      if (slideInfo.image_path) {
        setCurrentImagePath(slideInfo.image_path);
      } else {
        // Try to get the image path from the loaded slide
        const slide = loadedSlidesRef.current.get(slideIndex);
        if (slide && slide.image_path) {
          setCurrentImagePath(slide.image_path);
        } else {
          setCurrentImagePath(null);
        }
      }
    }
  };

  // Core logic for one transition cycle
  const advanceSlideAndAnimate = async () => {
    console.log(`[Advance] Starting advance, isPaused: ${isPausedRef.current}`);
    
    // Double-check pause state using ref to avoid closure issues
    if (isPausedRef.current) {
      console.log("[Advance] Cancelled - slideshow is paused");
      return;
    }

    const currentIdx = currentSlideIndexRef.current;
    const targetSlideIdx = nextSlideIndexRef.current;
    console.log(`[Advance] Advancing from slide ${currentIdx} to ${targetSlideIdx}`);

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

    // Update thumbnail image path for the TARGET slide
    updateCurrentImagePath(targetSlideIdx);

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
      animateTransition(transition, currentSlide, targetSlide);
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
      // Check pause state again
      if (isPausedRef.current) {
        console.log("[PostTransition] Skipping post-transition update because slideshow is paused");
        postTransitionUpdateTimerRef.current = null;
        return;
      }
      
      console.log(`[PostTransition] Completing transition from ${currentSlideIndexRef.current} to ${targetSlideIdx}`);
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
    console.log("[Animation] Setting up animation cycle");
    
    // Clear any existing interval
    if (animationTimerRef.current) {
      console.log("[Animation] Clearing existing animation interval");
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    
    // Create new interval
    console.log("[Animation] Creating new animation interval");
    animationTimerRef.current = setInterval(async () => {
      console.log(`[Animation] Interval triggered - isPausedRef: ${isPausedRef.current}`);
      
      // Always check the ref value, not the state value
      if (isPausedRef.current) {
        console.log("[Animation] Animation skipped - slideshow is paused");
        return;
      }
      
      console.log("[Animation] Advancing slide and animating");
      await advanceSlideAndAnimate();
    }, (TRANSITION_DURATION + SLIDE_DISPLAY_DURATION) * 1000);
  };

  // Handle page visibility changes
  useEffect(() => {
    console.log("[Visibility] Setting up visibility change handler");
    
    const handleVisibilityChange = () => {
      console.log(`[Visibility] Document visibility changed: ${document.hidden ? 'hidden' : 'visible'}`);
      console.log(`[Visibility] Was manually paused: ${wasManuallyPausedRef.current}`);
      
      if (document.hidden) {
        // Page is not visible - pause slideshow to save resources
        console.log("[Visibility] Page hidden - pausing slideshow");
        
        // Remember previous state only if we weren't already paused
        if (!isPausedRef.current) {
          wasManuallyPausedRef.current = false; // This wasn't a manual pause
        }
        
        setIsPaused(true);
      } else if (!wasManuallyPausedRef.current) {
        // Page is visible again - resume slideshow only if it wasn't manually paused
        console.log("[Visibility] Page visible again - resuming slideshow (not manually paused)");
        setIsPaused(false);
      } else {
        console.log("[Visibility] Page visible again - keeping slideshow paused (was manually paused)");
      }
    };

    // Add event listener for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up event listener on unmount
    return () => {
      console.log("[Visibility] Cleaning up visibility change handler");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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

        // Set initial image path if available
        if (manifest.slides[0].image_path) {
          setCurrentImagePath(manifest.slides[0].image_path);
        }

        if (
          manifest.slides[0].dominant_colors &&
          manifest.slides[0].dominant_colors.length > 0
        ) {
          onDominantColorsChange(manifest.slides[0].dominant_colors);
        }

        await loadSlideData(0); // Load slide 0
        
        // After loading slide data, check for image path if not found in manifest
        if (!manifest.slides[0].image_path) {
          const slide0 = loadedSlidesRef.current.get(0);
          if (slide0 && slide0.image_path) {
            setCurrentImagePath(slide0.image_path);
          }
        }

        // Preload the next few slides (e.g., slide 1 for the first immediate transition)
        for (let i = 1; i <= PRELOAD_SLIDES; i++) {
          const preloadIndex = i % manifest.total_slides;
          if (preloadIndex === 0 && manifest.total_slides > 1) continue; // Avoid preloading 0 if it's the current
          if (!loadedSlidesRef.current.has(preloadIndex)) {
            await loadSlideData(preloadIndex);
          }
        }
        
        // Wait for SVG to be ready
        const maxRetries = 10;
        let retries = 0;
        const waitForSvg = () => {
          if (svgRef.current) {
            console.log("SVG element is ready, rendering initial triangles...");
            setSvgReady(true);
            renderInitialTriangles(); // Display slide 0
            
            // Only proceed with transitions after successfully rendering triangles
            if (svgRef.current.childNodes.length > 0) {
              console.log("Performing first transition cycle immediately (0 -> 1)...");
              advanceSlideAndAnimate().then(() => {
                // Set up the regular animation cycle for subsequent slides
                console.log("Setting up regular animation cycle for subsequent slides...");
                setupAnimationCycle(); // Schedules 1 -> 2 and onwards
              });
            } else {
              console.error("Failed to render triangles, SVG is empty after render attempt");
              setErrorMessage("Failed to render slideshow triangles");
            }
          } else if (retries < maxRetries) {
            retries++;
            console.log(`SVG not ready, retrying (${retries}/${maxRetries})...`);
            setTimeout(waitForSvg, 100); // Try again after 100ms
          } else {
            console.error("SVG element not available after maximum retries");
            setErrorMessage("Failed to initialize slideshow display");
          }
        };
        
        // Start waiting for SVG
        waitForSvg();

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
        animationTimerRef.current = null;
      }
      if (postTransitionUpdateTimerRef.current) {
        clearTimeout(postTransitionUpdateTimerRef.current);
        postTransitionUpdateTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  // Check for debug mode on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.get('debug');
    setIsDebugMode(debug === '1');
    console.log(`Debug mode: ${debug === '1' ? 'enabled' : 'disabled'}`);
  }, []);

  // Render initial triangles once data is loaded
  const renderInitialTriangles = () => {
    console.log("Attempting to render initial triangles...");

    if (!svgRef.current) {
      console.error(
        "Cannot render triangles: SVG ref not available. This might happen if the component is not fully mounted."
      );
      return false; // Return false to indicate failure
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
      return false; // Return false to indicate failure
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
    
    return svg.childNodes.length > 0; // Return true if triangles were added
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
        ref={(node) => {
          svgRef.current = node;
          if (node && !svgReady) {
            console.log("SVG element mounted");
          }
        }}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full absolute top-0 left-0 object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      <div
        ref={slideNameRef}
        className="slide-name absolute bottom-8 left-8 z-10 text-white hidden"
      ></div>
      
      {/* Info icon instead of thumbnail */}
      {currentImagePath && (
        <div className="info-icon-container absolute bottom-8 left-8 z-20">
          <div 
            className="info-icon cursor-pointer rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ 
              width: ICON_SIZE, 
              height: ICON_SIZE,
              backgroundColor: "#000000",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
            onClick={() => setIsImageExpanded(true)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ width: ICON_SIZE/2, height: ICON_SIZE/2 }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
        </div>
      )}
      
      {/* Expanded image modal */}
      {isImageExpanded && currentImagePath && (
        <div 
          className="expanded-image-container fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="relative max-w-4xl max-h-4xl p-4">
            <img 
              src={`/data/${currentImagePath}`} 
              alt="Original" 
              className="max-w-full max-h-[80dvh] object-contain"
            />
            <button 
              className="absolute top-4 right-4 bg-white text-black w-8 h-8 rounded-full flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setIsImageExpanded(false);
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Debug Panel - only show if debug=1 is in URL */}
      {isDebugMode && (
        <div
          className="debug-panel absolute bottom-8 right-8 z-20 bg-black bg-opacity-70 p-2 rounded-lg flex flex-col gap-2"
        >
          <button
            onClick={togglePause}
            className={`font-bold text-white border-none py-2 px-4 rounded cursor-pointer ${isPaused ? "bg-green-500" : "bg-red-500"}`}
            style={{ cursor: 'pointer' }}
          >
            {isPaused ? "Play" : "Pause"}
          </button>
          <div className="text-white text-xs">
            Current Slide: {currentSlideIndexRef.current}
          </div>
          <div className="text-white text-xs">
            Paused: {isPaused ? "Yes" : "No"}
          </div>
          <div className="text-white text-xs">
            Manual Pause: {wasManuallyPausedRef.current ? "Yes" : "No"}
          </div>
        </div>
      )}
    </div>
  );
}
