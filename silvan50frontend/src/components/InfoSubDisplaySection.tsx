import React from "react";

interface InfoSubDisplaySectionProps {
  align?: "left" | "right";
}

const InfoSubDisplaySection: React.FC<InfoSubDisplaySectionProps> = ({
  align = "left",
}) => {
  return (
    <div className={`colortransition ${align === "right" ? "text-right" : ""}`}>
      <p>Anmeldung</p>
      <p>Programm</p>
    </div>
  );
};

export default InfoSubDisplaySection;
