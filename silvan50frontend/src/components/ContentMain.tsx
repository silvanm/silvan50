import React, { useRef } from "react";
import { ContentSectionProps } from "../types/DisplayTypes";

const ContentMain: React.FC<ContentSectionProps> = ({
  colors,
  isActive,
  onClick
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      className={`main-content font-bold colortransition ${onClick ? 'cursor-pointer' : ''} ${!isActive ? 'collapsed' : ''}`}
      onClick={onClick}
    >
      <div className="content-header">
        Einladung<span className="hide-when-collapsed">&nbsp;zu</span>
      </div>
      
      <div 
        ref={contentRef}
        className={`content-body ${!isActive ? 'collapsed' : ''}`}
        style={{
          maxHeight: isActive ? '100dvh' : '0', // Use a very large value when active
        }}
      >
        <h1 
          className="colortransition title-heading"
          style={{ color: colors[1] }}
        >
          <span className="colortransition">
            Silvans 50. Geburtstag
          </span>
        </h1>
        <p>am&nbsp;23.&nbsp;August&nbsp;2025 ab&nbsp;17&nbsp;Uhr</p>
        <p>
          Erlenstrasse&nbsp;3C
          <br />
          8048&nbsp;Zürich
        </p>
      </div>
    </div>
  );
};

export default ContentMain; 