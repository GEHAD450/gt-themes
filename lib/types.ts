export type Locale = 'ar' | 'en';
export type Platform = 'salla' | 'zid';

/** A text in Arabic, with English where there is one (the site falls back to Arabic). */
export interface Text {
  ar: string;
  en?: string;
}

/** A service offered to merchants: a card on the home page. */
export interface Service {
  /** A name from the icon list (`lib/icons.ts`). */
  icon: string;
  title: Text;
  text: Text;
  /** Short lines under the text: what the service covers. */
  points?: Text[];
  /** Small labels on the card: the platforms the service is for. */
  tags?: Text[];
}

/** One reason to choose GT-THEMES: a small card on the home page. */
export interface Feature {
  icon: string;
  title: Text;
  text: Text;
}

/** When support answers: days of the week (0 = Sunday … 6 = Saturday) and hours on a 24-hour clock, in a time zone. */
export interface WorkHours {
  days: number[];
  from: number;
  to: number;
  /** An IANA name: "Africa/Cairo", "Asia/Riyadh". */
  timezone: string;
}

export interface Profile {
  brand: string;
  name: Text;
  role: Text;
  hero_title: Text;
  hero_subtitle: Text;
  /** The opening line about the developer. Words between two pairs of stars (**like this**) stand out. */
  bio: Text;
  /** Short lines under the opening line. */
  bio_points?: Text[];
  services?: Service[];
  features?: Feature[];
  hours?: WorkHours;
  experience: Text[];
  stats: { value: number; label: Text }[];
  skills: string[];
  email: string;
  phone: string;
  /** Digits only, with the country code: the number WhatsApp opens. */
  whatsapp: string;
  whatsapp_message: Text;
  /** The code Google Search Console gives to prove the site is the owner's (the `content` of its meta tag). */
  google_verification?: string;
}

/** An arrow on a section's picture: where it points (percent of the picture) and what it says. */
export interface Marker {
  x: number;
  y: number;
  text: Text;
}

/** One documented part of a theme: a picture, what it is for, how to set it up. */
export interface DocSection {
  id: string;
  title: Text;
  image?: string;
  image_mobile?: string;
  /** Width and height of the pictures, read from the files when the site is built. */
  image_size?: [number, number];
  image_mobile_size?: [number, number];
  /** Numbered arrows over the desktop picture, each with a line of explanation. */
  markers?: Marker[];
  text?: Text;
  steps?: { ar: string[]; en?: string[] };
  /** `label`: the option's name as the Arabic editor shows it; `label_en`: its name in English. */
  settings?: { label: string; label_en?: string; note?: Text }[];
  tip?: Text;
}

export interface DocGroup {
  id: string;
  title: Text;
  /** "faq": the group is a list of questions and answers, shown folded and without pictures. */
  kind?: 'faq';
  sections: DocSection[];
}

/** A look of the theme, or a demo store running it: its name, its picture, and its live address once it has one. */
export interface ThemeDemo {
  label: Text;
  /** The live preview's address; empty while it is not public. */
  url: string;
  /** A few words shown instead of the preview button while there is no address ("applied from the theme settings"). */
  note?: Text;
  image?: string;
  image_size?: [number, number];
}

export interface Theme {
  slug: string;
  platform: Platform;
  name: Text;
  tagline?: Text;
  summary?: Text;
  cover?: string;
  cover_size?: [number, number];
  demos?: ThemeDemo[];
  highlights?: Text[];
  groups: DocGroup[];
}

/** A store that runs one of the themes — managed from the control panel. */
export interface StoreEntry {
  id: string;
  name: string;
  url: string;
  /** The theme's slug. */
  theme: string;
  note?: string;
  added: string;
}

/** A blog article: a file in `content/blog/`, written from the control panel. */
export interface Post {
  /** The article's name in its address: lowercase latin letters, digits and dashes. */
  slug: string;
  title: Text;
  /** Two sentences: shown on the blog page and to search engines. */
  summary: Text;
  /** A wide picture (1200×630), also used when the article is shared. */
  cover?: string;
  cover_size?: [number, number];
  /** The day it was published: YYYY-MM-DD. */
  date: string;
  tags?: string[];
  /** The article itself, in the simple marks `Prose` understands (## heading, - list, **bold**, [link](address), ![picture](address)). */
  body: Text;
  /** A draft (false) stays out of the site. */
  published: boolean;
}
