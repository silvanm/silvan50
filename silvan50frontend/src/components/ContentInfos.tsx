import React, { useRef } from "react";
import { ContentSectionProps } from "../types/DisplayTypes";

const ContentInfos: React.FC<ContentSectionProps> = ({ 
  colors, 
  isActive, 
  onClick 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const infoItems = [
    { label: "Dresscode", content: "Festlich oder bequem – je nach persönlichem Stil" },
    { label: "ÖV", content: "Gut erreichbar mit Tram und Bus (Haltestelle Rautistrasse)" },
    { label: "Parkplätze", content: "Begrenzt verfügbar" },   
    { label: "Kontakt", content: "<a href='mailto:silvan@muehlemann.com'>silvan@muehlemann.com</a>, +41 78 714 14 78" }, 
  ];

  return (
    <div className={`infos-content colortransition`} onClick={onClick}>
      <div className={`content-header ${onClick ? "cursor-pointer" : ""}`}>
        Infos
      </div>

      <div
        ref={contentRef}
        className={`content-body ${!isActive ? "collapsed" : ""}`}
        style={{
          maxHeight: isActive ? "100dvh" : "0", // Use a very large value when active
        }}
      >
        <table className="infos-container my-2 w-full">
          <tbody>
            {infoItems.map((item, index) => (
              <tr key={index} className="infos-row mb-1">
                <td className="infos-label pr-2 whitespace-nowrap colortransition text-left" style={{ color: colors[1] }}>{item.label}</td>
                <td className="infos-content" dangerouslySetInnerHTML={{__html: item.content}}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContentInfos;
