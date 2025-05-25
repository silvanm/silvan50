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
  const pages: {type: PageType; label: string}[] = [
    { type: "main", label: "Main Info Page" },
    { type: "rsvp", label: "RSVP Page" },
    { type: "timetable", label: "Timetable Page" },
  ];

  return (
    <div className="navigation-controls flex justify-center items-center py-1">
      {pages.map((page) => (
        <button 
          key={page.type}
          className="mx-3 colortransition flex items-center justify-center" 
          onClick={() => setActivePage(page.type)}
          style={{
            color: activePage === page.type ? activeColor : "currentColor",
            fontSize: activePage === page.type ? "1rem" : "0.75rem",
            opacity: activePage === page.type ? 1 : 0.7,
            transform: activePage === page.type ? "scale(1.2)" : "scale(1)",
            transition: "color 5s ease-in-out, transform 0.5s ease-in-out;",
            width: "20px",
            height: "20px",
            lineHeight: 1
          }}
          aria-label={page.label}
        >
          <span className="inline-flex items-center justify-center">&#11044;</span>
        </button>
      ))}
    </div>
  );
};

export default NavigationButtons; 