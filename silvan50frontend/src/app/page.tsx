"use client"; // Add "use client" because of useState and useEffect

import React, { useState, useEffect } from "react";
import InfoDisplaySectionVertical from "../components/InfoDisplaySectionVertical"; // Updated import path and name
import SlideshowDisplay from "../components/SlideshowDisplay"; // Adjusted path
import InfoDisplaySectionHorizontal from "@/components/InfoDisplaySectionHorizontal";

export default function Home() { // Renamed from App to Home and made default export
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window !== "undefined" && window.innerHeight > window.innerWidth // Added window check for SSR
  );
  // Ensure dominantColors state is defined ONLY ONCE
  const [dominantColors, setDominantColors] = useState<string[]>(["#000", "#000", "#000"]);

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

  // Conditional rendering for SSR safety if isPortrait is not yet determined
  if (typeof window === "undefined" || isPortrait === null) {
    // You might want a placeholder or null during SSR or before first paint
    return null; 
  }

  return (
    <div className="w-screen h-screen overflow-hidden"> {/* REVERTED: Removed conditional class */}
      {isPortrait ? (
        // Portrait layout: InfoDisplaySection top, SlideshowDisplay bottom
        <div className="flex flex-col h-full">
          {/* InfoDisplaySection at the top (approx 1/3 height) */}
          <div className="h-[20%] w-full"> 
            <InfoDisplaySectionHorizontal
            
              colors={dominantColors}
            />
          </div>
          {/* SlideshowDisplay at the bottom (approx 2/3 height) */}
          <div className="h-[80%] w-full">
            <SlideshowDisplay 
              onDominantColorsChange={(newColors) => setDominantColors(newColors)}
            />
          </div>
        </div>
      ) : (
        // Landscape layout: SlideshowDisplay left, InfoDisplaySection right
        <div className="flex flex-row h-full">
          {/* SlideshowDisplay on the left (approx 2/3 width) */}
          <div className="w-[66%] h-full">
            <SlideshowDisplay 
              onDominantColorsChange={(newColors) => setDominantColors(newColors)}
            />            
          </div>
          {/* InfoDisplaySection on the right (approx 1/3 width) */}
          <div className="flex-1 min-w-[33%] h-full">
            <InfoDisplaySectionVertical
              colors={dominantColors}
            />
          </div>
        </div>
      )}
    </div>
  );
}
