import React, { useRef } from "react";
import { ContentSectionProps } from "../types/DisplayTypes";

const ContentMain: React.FC<ContentSectionProps> = ({
  colors,
  isActive,
  onClick,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`main-content font-bold colortransition tracking-tight ${
        !isActive ? "collapsed" : ""
      }`}
      onClick={onClick}
    >
      <div className={`content-header ${onClick ? "cursor-pointer" : ""}`}>
        Einladung<span className="hide-when-collapsed">&nbsp;zu</span>
      </div>

      <div
        ref={contentRef}
        className={`content-body ${!isActive ? "collapsed" : ""}`}
        style={{
          maxHeight: isActive ? "100dvh" : "0", // Use a very large value when active
        }}
      >
        <h1
          className="colortransition title-heading"
          style={{ color: colors[1] }}
        >
          <span className="colortransition">Silvans 50. Geburtstag</span>
        </h1>
        <p>am&nbsp;23.&nbsp;August&nbsp;2025 ab&nbsp;17&nbsp;Uhr</p>
        <p>
          <a
            href="https://maps.app.goo.gl/MDFjJwPcfrtWTVrz8"
            className="no-underline"
            target="_blank"
          >
            Erlenstrasse&nbsp;3C{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline-block align-baseline map-icon"
              viewBox="0 0 16 16"
            >
              <path
                fill="currentColor"
                d="m7.385 15.293l-.192-.13a18 18 0 0 1-2.666-2.283C3.1 11.385 1.5 9.144 1.5 6.499C1.5 3.245 4.141 0 8 0s6.5 3.245 6.5 6.5c0 2.645-1.6 4.886-3.027 6.379a18 18 0 0 1-2.666 2.283q-.122.085-.192.13c-.203.135-.41.263-.615.393c-.205-.13-.412-.258-.615-.392M8 8.5a2 2 0 1 0 0-4a2 2 0 0 0 0 4"
              />
            </svg>
            <br />
            8048&nbsp;Zürich
          </a>
        </p>
      </div>
    </div>
  );
};

export default ContentMain;
