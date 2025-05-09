import React from 'react';

interface DominantColorSquareProps {
  colors: string[];
  size?: number;
  top?: string;
  right?: string;
  zIndex?: number;
  transitionDuration?: number;
}

const DominantColorSquare: React.FC<DominantColorSquareProps> = ({
  colors,
  top = '2rem',
  right = '2rem',
  zIndex = 20,
  transitionDuration = 5
}) => {
  return (
    <div
      className="dominant-color-square w-full p-5"
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
      >Silvan50</h1>
    </div>
  );
};

export default DominantColorSquare; 