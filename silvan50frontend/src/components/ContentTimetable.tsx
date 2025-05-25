import React, { useRef } from "react";
import { ContentSectionProps } from "../types/DisplayTypes";

const ContentTimetable: React.FC<ContentSectionProps> = ({
  colors,
  isActive,
  onClick
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const schedule = [
    { time: "17:00", event: "Eintreffen & Apéro" },
    { time: "18:00", event: "Flying Dinner – <a href='https://www.mangosteen.ch/' target='_blank'>Mangosteen Catering</a>" },
    { time: "19:45", event: "Klavier-Intermezzo <a href='https://www.danielatimokhine.ch/' target='_blank'>Daniela Timokhine</a> (Solistin Tonhalle)" },
    { time: "20:30", event: "Dessert & Kaffee" },
    { time: "21:00", event: "Drinks & Lounge-Beats" },
    { time: "23:00", event: "Offizieller Ausklang" },
  ];

  return (
    <div 
      className={`timetable-content colortransition`}
      onClick={onClick}
    >
      <div className={`content-header ${onClick ? 'cursor-pointer' : ''}`}>
        Programm
      </div>
      
      <div 
        ref={contentRef}
        className={`content-body ${!isActive ? 'collapsed' : ''}`}
        style={{
          maxHeight: isActive ? '100dvh' : '0', // Use a very large value when active
        }}
      >
        <table className="timetable-container my-2 w-full">
          <tbody>
            {schedule.map((item, index) => (
              <tr key={index} className="timetable-row mb-1">
                <td className="timetable-time pr-2 whitespace-nowrap colortransition text-right" style={{ color: colors[1] }}>{item.time}</td>
                <td className="timetable-event" dangerouslySetInnerHTML={{__html: item.event}}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContentTimetable; 