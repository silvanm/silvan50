import React from "react";

interface InfoMainDisplaySectionProps {
  colors: string[];
}

const InfoMainDisplaySection: React.FC<InfoMainDisplaySectionProps> = ({
  colors,
}) => {
  return (
    <div className="colortransition">
      <p>Einladung&nbsp;zu</p>
      <h1 style={{ color: colors[1] }} className="colortransition">
        Silvans 50. Geburtstag
      </h1>
      <p>am&nbsp;23.&nbsp;August&nbsp;2025 ab&nbsp;17&nbsp;Uhr</p>
      <p>
        Erlenstrasse&nbsp;3C
        <br />
        8048&nbsp;Zürich
      </p>
    </div>
  );
};

export default InfoMainDisplaySection;
