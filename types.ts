export enum Page {
  HOME = "HOME",
  ABOUT = "ABOUT",
  EVENTS = "EVENTS",
  ADUAN = "ADUAN",
  GALLERY = "GALLERY",
}

export interface EventItem {
  id: string;
  date: string;
  month: string;
  title: string;
  location: string;
  time: string;
  description: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  span?: string; // class for grid span
}

export interface ExecutiveMember {
  role: string;
  name: string;
}
