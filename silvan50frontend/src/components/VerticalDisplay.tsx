import React from "react";
import { DisplayProps } from "../types/DisplayTypes";
import ContentMain from "./ContentMain";
import ContentRSVP from "./ContentRSVP";
import ContentTimetable from "./ContentTimetable";

const VerticalDisplay: React.FC<DisplayProps> = ({
  colors,
  activePage,
  setActivePage,
}) => {
  return (
    <div className="vertical-display-container flex flex-col h-full p-5">
      <div 
        className="main-section colortransition"
        style={{
          color: colors.main[2],
          transition: "all 0.5s ease",
          flex: activePage === "main" ? "1 0 auto" : "0 0 auto"
        }}
      >
        <ContentMain 
          colors={colors.main} 
          isActive={activePage === "main"} 
          onClick={() => setActivePage("main")}
        />
      </div>

      <div 
        className="rsvp-section colortransition mt-2"
        style={{
          color: colors.rsvp[2],
          transition: "all 0.5s ease",
          flex: activePage === "rsvp" ? "1 0 auto" : "0 0 auto"
        }}
      >
        <ContentRSVP 
          colors={colors.rsvp} 
          isActive={activePage === "rsvp"} 
          onClick={() => setActivePage("rsvp")}
        />
      </div>

      <div 
        className="timetable-section colortransition mt-2"
        style={{
          color: colors.timetable[2],
          transition: "all 0.5s ease",
          flex: activePage === "timetable" ? "1 0 auto" : "0 0 auto"
        }}
      >
        <ContentTimetable 
          colors={colors.timetable} 
          isActive={activePage === "timetable"} 
          onClick={() => setActivePage("timetable")}
        />
      </div>
    </div>
  );
};

export default VerticalDisplay; 