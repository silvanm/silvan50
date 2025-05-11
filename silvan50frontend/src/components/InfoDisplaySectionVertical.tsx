import React from "react";
import InfoMainDisplaySection from "./InfoMainDisplaySection";
import InfoSubDisplaySection from "./InfoSubDisplaySection";

interface InfoDisplaySectionProps {
  colors: string[];
  size?: number;
  top?: string;
  right?: string;
  zIndex?: number;
  transitionDuration?: number;
}

const InfoDisplaySectionVertical: React.FC<InfoDisplaySectionProps> = ({
  colors,
  top = "2rem",
  right = "2rem",
  zIndex = 20,
}) => {
  return (
    <div
      className="info-display-section w-full h-full p-5 colortransition"
      style={{
        top,
        right,
        zIndex,
        backgroundColor: colors[0] || "white",
      }}
    >
      <div
      className="colortransition font-bold flex flex-col justify-between h-full"
        style={{
          color: colors[2],          
          fontSize: "3vw",
          lineHeight: "1.1",
        }}
      >
          <InfoMainDisplaySection colors={colors} />
          <InfoSubDisplaySection />        
      </div>
    </div>
  );
};

export default InfoDisplaySectionVertical;
