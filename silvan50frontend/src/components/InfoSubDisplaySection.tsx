import React, { useState } from "react";

// Simple RSVP placeholder component
const RSVPComponent: React.FC = () => {
  return (
    <div className="rsvp-container py-2">
      <p className="text-sm opacity-80">Bitte bestätigen Sie bis zum 30. April 2023</p>
      <p className="text-sm opacity-80">Please RSVP by April 30, 2023</p>
    </div>
  );
};

// Timetable component with schedule information
const TimetableComponent: React.FC = () => {
  const schedule = [
    { time: "17:00", event: "Eintreffen & Apéro auf der Terrasse" },
    { time: "18:00", event: "Flying Dinner – Mangosteen Catering" },
    { time: "19:45", event: "Klavier-Intermezzo Daniela Timokhine" },
    { time: "20:30", event: "Dessert & Kaffee" },
    { time: "21:00", event: "Drinks & Lounge-Beats" },
    { time: "23:00", event: "Offizieller Ausklang" },
  ];

  return (
    <div className="timetable-container py-2">
      {schedule.map((item, index) => (
        <div key={index} className="timetable-row flex mb-1">
          <div className="timetable-time font-medium mr-3">{item.time}</div>
          <div className="timetable-event">{item.event}</div>
        </div>
      ))}
    </div>
  );
};

interface InfoSubDisplaySectionProps {
  align?: "left" | "right";
}

const InfoSubDisplaySection: React.FC<InfoSubDisplaySectionProps> = ({
  align = "left",
}) => {
  // State to track which accordion sections are open
  const [openSections, setOpenSections] = useState({
    rsvp: false,
    timetable: false,
  });

  // Toggle a section's open/closed state
  const toggleSection = (section: 'rsvp' | 'timetable') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper to get the appropriate text alignment class
  const textAlignClass = align === "right" ? "text-right" : "text-left";
  
  return (
    <div className={`colortransition ${textAlignClass}`}>
      {/* RSVP Section */}
      <div className="accordion-section mb-4">
        <button 
          onClick={() => toggleSection('rsvp')}
          className={`w-full flex items-center justify-between font-medium text-lg colortransition py-1 ${textAlignClass}`}
          aria-expanded={openSections.rsvp}
        >
          <span>Anmeldung</span>
          <svg 
            className={`w-5 h-5 transform transition-transform duration-300 ${openSections.rsvp ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            openSections.rsvp ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <RSVPComponent />
        </div>
      </div>

      {/* Timetable Section */}
      <div className="accordion-section">
        <button 
          onClick={() => toggleSection('timetable')}
          className={`w-full flex items-center justify-between font-medium text-lg colortransition py-1 ${textAlignClass}`}
          aria-expanded={openSections.timetable}
        >
          <span>Programm</span>
          <svg 
            className={`w-5 h-5 transform transition-transform duration-300 ${openSections.timetable ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            openSections.timetable ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <TimetableComponent />
        </div>
      </div>
    </div>
  );
};

export default InfoSubDisplaySection;
