import React, { useState } from "react";
import { PageType } from "../types/DisplayTypes";
import VerticalDisplay from "./VerticalDisplay";
import HorizontalDisplay from "./HorizontalDisplay";

interface InfoDisplayProps {
  colors: {
    main: string[];
    rsvp: string[];
    timetable: string[];
  };
  isHorizontal?: boolean;
}

const InfoDisplay: React.FC<InfoDisplayProps> = ({
  colors,
  isHorizontal = false,
}) => {
  const [activePage, setActivePage] = useState<PageType>("main");

  return (
    <div
      className="info-display w-full h-full colortransition"
      style={{
        backgroundColor: colors[activePage][0] || "white",
      }}
    >
      {isHorizontal ? (
        <HorizontalDisplay 
          colors={colors} 
          activePage={activePage} 
          setActivePage={setActivePage} 
        />
      ) : (
        <VerticalDisplay 
          colors={colors} 
          activePage={activePage} 
          setActivePage={setActivePage} 
        />
      )}
    </div>
  );
};

export default InfoDisplay; 