export type PageType = 'main' | 'rsvp' | 'timetable' | 'infos';

export interface PageColors {
  main: string[];
  rsvp: string[];
  timetable: string[];
  infos: string[];
}

export interface DisplayProps {
  colors: PageColors;
  activePage: PageType;
  setActivePage: (page: PageType) => void;
}

export interface ContentSectionProps {
  colors: string[];
  isActive: boolean;
  onClick?: () => void;
} 