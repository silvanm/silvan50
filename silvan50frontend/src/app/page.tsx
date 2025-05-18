"use client"; // Add "use client" because of useState and useEffect

import React, { useState, useEffect } from "react";
import InfoDisplay from "../components/InfoDisplay"; 
import SlideshowDisplay from "../components/SlideshowDisplay";
import Link from "next/link";

export default function Home() {
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== "undefined" && window.innerHeight > window.innerWidth // Added window check for SSR
  );
  
  // Initialize color state with black.
  const [colors, setColors] = useState({
    main: ["#000000", "#000000", "#000000"], 
    rsvp: ["#000000", "#000000", "#000000"], 
    timetable: ["#000000", "#000000", "#000000"], 
  });
  
  // Add state for debug mode
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    // Ensure window is defined (for client-side only execution)
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    // Call handler once initially to set the correct layout
    handleResize(); 
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Check for debug mode on component mount
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.get('debug');
    setIsDebugMode(debug === '1');
    console.log(`Debug mode: ${debug === '1' ? 'enabled' : 'disabled'}`);
  }, []);

  // Handle color updates from the slideshow
  const handleColorsChange = (newColors: string[]) => {
    // Update each section's colors based on the dominant colors from the slideshow
    setColors({
      main: [newColors[0], newColors[1], newColors[2]],
      rsvp: [newColors[0], newColors[1], newColors[2]],
      timetable: [newColors[0], newColors[1], newColors[2]],
    });
  };

  // Conditional rendering for SSR safety if isPortrait is not yet determined
  if (typeof window === "undefined" || isPortrait === null) {
    return null; 
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      {/* Admin navigation - only show in debug mode */}
      {isDebugMode && (
        <div className="absolute top-4 right-4 z-10">
          <Link 
            href="/images" 
            className="px-3 py-1 bg-black bg-opacity-50 text-white rounded text-sm hover:bg-opacity-70 transition-all"
          >
            Image Library
          </Link>
        </div>
      )}

      {isPortrait ? (
        // Portrait layout: InfoDisplay top, SlideshowDisplay bottom
        <div className="flex flex-col h-full">
          {/* InfoDisplay at the top (approx 1/3 height) */}
          <div className="h-[40%] md:h-[30%] w-full"> 
            <InfoDisplay
              colors={colors}
              isHorizontal={true}
            />
          </div>
          {/* SlideshowDisplay at the bottom (approx 2/3 height) */}
          <div className="h-[60%] md:h-[70%] w-full">
            <SlideshowDisplay 
              onDominantColorsChange={handleColorsChange}
            />
          </div>
        </div>
      ) : (
        // Landscape layout: SlideshowDisplay left, InfoDisplay right
        <div className="flex flex-row h-full">
          {/* SlideshowDisplay on the left (approx 2/3 width) */}
          <div className="w-[66%] h-full">
            <SlideshowDisplay 
              onDominantColorsChange={handleColorsChange}
            />            
          </div>
          {/* InfoDisplay on the right (approx 1/3 width) */}
          <div className="flex-1 min-w-[33%] h-full">
            <InfoDisplay
              colors={colors}
              isHorizontal={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
