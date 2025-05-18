import React from "react";
import { PageType } from "../types/DisplayTypes";

interface NavigationButtonsProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  activeColor?: string;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  activePage,
  setActivePage,
  activeColor = "currentColor",
}) => {
  return (
    <div className="navigation-controls flex justify-center items-center">
      <button 
        className="mx-3 colortransition flex items-center justify-center" 
        onClick={() => setActivePage("main")}
        style={{
          color: activePage === "main" ? activeColor : "currentColor",
          fontSize: activePage === "main" ? "1rem" : "0.75rem",
          opacity: activePage === "main" ? 1 : 0.7,
          transform: activePage === "main" ? "scale(1.2)" : "scale(1)",
          transition: "all 0.5s ease-in-out",
          width: "20px",
          height: "20px",
          lineHeight: 1
        }}
        aria-label="Main Info Page"
      >
        <span className="inline-flex items-center justify-center">&#11044;</span>
      </button>
      <button 
        className="mx-3 colortransition flex items-center justify-center" 
        onClick={() => setActivePage("rsvp")}
        style={{
          color: activePage === "rsvp" ? activeColor : "currentColor",
          fontSize: activePage === "rsvp" ? "1rem" : "0.75rem",
          opacity: activePage === "rsvp" ? 1 : 0.7,
          transform: activePage === "rsvp" ? "scale(1.2)" : "scale(1)",
          transition: "all 0.5s ease-in-out",
          width: "20px",
          height: "20px",
          lineHeight: 1
        }}
        aria-label="RSVP Page"
      >
        <span className="inline-flex items-center justify-center">&#11044;</span>
      </button>
      <button 
        className="mx-3 colortransition flex items-center justify-center" 
        onClick={() => setActivePage("timetable")}
        style={{
          color: activePage === "timetable" ? activeColor : "currentColor",
          fontSize: activePage === "timetable" ? "1rem" : "0.75rem",
          opacity: activePage === "timetable" ? 1 : 0.7,
          transform: activePage === "timetable" ? "scale(1.2)" : "scale(1)",
          transition: "all 0.5s ease-in-out",
          width: "20px",
          height: "20px",
          lineHeight: 1
        }}
        aria-label="Timetable Page"
      >
        <span className="inline-flex items-center justify-center">&#11044;</span>
      </button>
    </div>
  );
};

export default NavigationButtons; 