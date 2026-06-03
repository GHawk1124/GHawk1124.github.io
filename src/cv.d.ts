export interface CV {
  basics: Basics;
  work: Array<Work>;
  volunteer?: Array<Volunteer>;
  education: Array<Education>;
  awards?: Array<Awards>;
  certificates?: Array<Certificates>;
  publications?: Array<Publications>;
  skills: Array<Skills>;
  languages?: Array<Languages>;
  interests?: Array<Interests>;
  references?: Array<References>;
  projects: Array<Projects>;
  pageLayout?: string;
  images?: ImagesGallery | null;
  analyticsCode?: string;
}

interface Basics {
  name: string;
  label: string;
  image: string;
  email: string;
  phone?: string;
  url: string;
  summary: string;
  theme: string;
  location: Location;
  profiles: Array<Profiles>;
  beian?: Beian;
}

interface Location {
  address: string;
  postalCode?: string;
  city: string;
  countryCode: string;
  region: string;
}

interface Profiles {
  icon: string;
  network: string;
  username: string;
  url: string;
}

interface Beian {
  mint?: string;
  police?: string;
}

interface Work {
  name: string;
  position: string;
  url?: string;
  startDate: DateStr;
  endDate: DateStr | null;
  summary?: string;
  location_type?: string;
  location?: string;
  responsibilities?: Array<string>;
  achievements?: Array<string>;
  highlights?: Highlight;
  skills?: Record<string, string>;
}

type DateStr = `${string}-${string}-${string}` | string;

interface Volunteer {
  organization: string;
  position: string;
  url: string;
  startDate: DateStr;
  endDate: DateStr;
  summary: string;
  highlights: Highlight;
}

interface Skills {
  icon?: string;
  name: string;
  level?: string;
  keywords?: Array<string>;
}

interface Awards {
  title: string;
  date: string;
  awarder: string;
  summary: string;
}

interface Certificates {
  name: string;
  date: DateStr;
  issuer: string;
  url: string;
}

interface Publications {
  name: string;
  publisher: string;
  releaseDate: DateStr;
  url: string;
  summary: string;
}

interface Education {
  institution: string;
  url?: string;
  area: string;
  studyType: string;
  startDate: DateStr;
  endDate: DateStr | null;
  score?: string;
  courses?: Array<string>;
}

interface Languages {
  language: string;
  fluency: string;
}

interface Projects {
  name: string;
  slug: string;
  isActive: boolean;
  description: string;
  highlights?: Highlight;
  url?: string;
  github?: string;
  demo?: string;
}

interface Interests {
  name: string;
  keywords: Array<string>;
}

interface References {
  name: string;
  reference: string;
}

interface ImagesGallery {
  intro?: string;
  list: Array<{
    image: string;
    alt: string;
    desc: string;
  }>;
}

type Highlight = Array<string>;
