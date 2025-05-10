import React from 'react';

interface InfoDisplaySectionProps {
  colors: string[];
  size?: number;
  top?: string;
  right?: string;
  zIndex?: number;
  transitionDuration?: number;
}

const InfoDisplaySection: React.FC<InfoDisplaySectionProps> = ({
  colors,
  top = '2rem',
  right = '2rem',
  zIndex = 20,
  transitionDuration = 5
}) => {
  return (
    <div
      className="info-display-section w-full h-full p-5"
      style={{
        top,
        right,
        zIndex,
        backgroundColor: colors[0] || '#000000',
        transition: `background-color ${transitionDuration}s ease-in-out`,
      }}
    >
      <h1 style={{ 
        color: colors[2], 
        transition: `color ${transitionDuration}s ease-in-out`,
      }}
      className="text-6xl font-bold"
      >Silvan51</h1>
    </div>
  );
};

export default InfoDisplaySection; 