import React, { useRef } from "react";
import { ContentSectionProps } from "../types/DisplayTypes";

const ContentTimetable: React.FC<ContentSectionProps> = ({
  isActive,
  onClick
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const schedule = [
    { time: "17:00", event: "Eintreffen & Apéro" },
    { time: "18:00", event: "Flying Dinner – Mangosteen Catering" },
    { time: "19:45", event: "Klavier-Intermezzo Daniela Timokhine" },
    { time: "20:30", event: "Dessert & Kaffee" },
    { time: "21:00", event: "Drinks & Lounge-Beats" },
    { time: "23:00", event: "Offizieller Ausklang" },
  ];

  return (
    <div 
      className={`timetable-content colortransition ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="content-header py-1">
        Programm
      </div>
      
      <div 
        ref={contentRef}
        className={`content-body ${!isActive ? 'collapsed' : ''}`}
        style={{
          maxHeight: isActive ? '100dvh' : '0', // Use a very large value when active
        }}
      >
        <table className="timetable-container py-2 w-full">
          <tbody>
            {schedule.map((item, index) => (
              <tr key={index} className="timetable-row mb-1">
                <td className="timetable-time font-medium pr-3 whitespace-nowrap">{item.time}</td>
                <td className="timetable-event">{item.event}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContentTimetable; 