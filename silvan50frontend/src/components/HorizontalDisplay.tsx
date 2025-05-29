import React, { useState } from "react";
import { DisplayProps, PageType } from "../types/DisplayTypes";
import ContentMain from "./ContentMain";
import ContentRSVP from "./ContentRSVP";
import ContentTimetable from "./ContentTimetable";
import ContentInfos from "./ContentInfos";
import NavigationButtons from "./NavigationButtons";
import { useSwipeable } from "react-swipeable";

const HorizontalDisplay: React.FC<DisplayProps> = ({
  colors,
  activePage,
  setActivePage,
}) => {
  // State to track swipe position
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate the transform position based on active page
  const getBaseTransformValue = () => {
    switch (activePage) {
      case "main": return 0;
      case "rsvp": return -100;
      case "timetable": return -200;
      case "infos": return -300;
      default: return 0;
    }
  };

  // Order of pages for navigation
  const pageOrder: PageType[] = ["main", "rsvp", "timetable", "infos"];
  
  // Get current page index
  const currentIndex = pageOrder.indexOf(activePage);

  // Setup swipe handlers
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      // Only apply offset if swiping horizontally
      if (Math.abs(eventData.deltaX) > Math.abs(eventData.deltaY)) {
        setIsDragging(true);
        
        // Calculate new offset based on swipe distance (as percentage of screen width)
        const newOffset = (eventData.deltaX / window.innerWidth) * 100;
        
        // Limit how far user can swipe past the first or last slide
        if (
          (currentIndex === 0 && newOffset > 0) || 
          (currentIndex === pageOrder.length - 1 && newOffset < 0)
        ) {
          // Apply resistance when trying to swipe past the edge
          setOffset(newOffset / 3);
        } else {
          setOffset(newOffset);
        }
      }
    },
    onSwiped: (eventData) => {
      setIsDragging(false);
      
      // If swipe was significant enough, change page
      if (Math.abs(eventData.deltaX) > 50) {
        const isLeftSwipe = eventData.deltaX < 0;
        
        if (isLeftSwipe && currentIndex < pageOrder.length - 1) {
          // Swipe left - go to next page
          setActivePage(pageOrder[currentIndex + 1]);
        } else if (!isLeftSwipe && currentIndex > 0) {
          // Swipe right - go to previous page
          setActivePage(pageOrder[currentIndex - 1]);
        }
      }
      
      // Reset offset
      setOffset(0);
    },
    trackMouse: true,
    trackTouch: true
  });

  // Apply transform with base value plus any active swipe offset
  const getTransformStyle = () => {
    const baseValue = getBaseTransformValue();
    const totalOffset = baseValue + offset;
    
    return {
      transform: `translateX(${totalOffset}vw)`,
      transition: isDragging ? 'none' : 'transform 0.5s ease-in-out'
    };
  };

  return (
    <div className="horizontal-display-container h-full overflow-hidden relative ">
      {/* Fixed navigation buttons */}
      <div className="absolute left-0 right-0 bottom-5 z-10">
        <NavigationButtons 
          activePage={activePage}
          setActivePage={setActivePage}
          activeColor={colors[activePage][1]}
        />
      </div>

      {/* Sliding content with swipe handlers */}
      <div 
        {...swipeHandlers}
        className="horizontal-display flex flex-row w-[400vw] h-full"
        style={getTransformStyle()}
      >
        {/* Main Section */}
        <div 
          className="main-section colortransition w-screen h-full p-5 flex flex-col"
          style={{
            color: colors.main[2],
            backgroundColor: colors.main[0],
          }}
        >
          <ContentMain 
            colors={colors.main} 
            isActive={true} // Always show content in horizontal view
          />
        </div>

        {/* RSVP Section */}
        <div 
          className="rsvp-section colortransition w-screen h-full p-5 flex flex-col "
          style={{
            color: colors.rsvp[2],
            backgroundColor: colors.rsvp[0],
          }}
        >
          <ContentRSVP 
            colors={colors.rsvp} 
            isActive={true} // Always show content in horizontal view
          />
        </div>

        {/* Timetable Section */}
        <div 
          className="timetable-section colortransition w-screen h-full p-5 flex flex-col "
          style={{
            color: colors.timetable[2],
            backgroundColor: colors.timetable[0],
          }}
        >
          <ContentTimetable 
            colors={colors.timetable} 
            isActive={true} // Always show content in horizontal view
          />
        </div>

        {/* Infos Section */}
        <div 
          className="infos-section colortransition w-screen h-full p-5 flex flex-col "
          style={{
            color: colors.infos[2],
            backgroundColor: colors.infos[0],
          }}
        >
          <ContentInfos 
            colors={colors.infos} 
            isActive={true} // Always show content in horizontal view
          />
        </div>
      </div>
    </div>
  );
};

export default HorizontalDisplay; 