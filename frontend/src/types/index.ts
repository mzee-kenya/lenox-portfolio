export type StatusKind = "implemented" | "in_progress" | "planned";

export interface Profile {
  id: number;
  name: string;
  title: string;
  brand: string;
  role_tagline: string;
  summary: string;
  about: string;
  location: string;
  email: string;
  phone: string;
  photo: string;
  github_url: string;
  linkedin_url: string;
  website_url: string;
  meta_title: string;
  meta_description: string;
}

export type SkillCategoryKey =
  | "frontend"
  | "backend"
  | "database"
  | "mobile"
  | "tools"
  | "engineering"
  | "other";

export interface Skill {
  id: number;
  name: string;
  category: SkillCategoryKey;
  order: number;
  active: boolean;
}

export interface SkillGroup {
  category: SkillCategoryKey;
  categoryLabel: string;
  items: Skill[];
}

export interface Experience {
  id: number;
  title: string;
  organization: string;
  employment_type: string;
  location: string;
  start_date: string;
  end_date: string;
  current: boolean;
  description: string;
  order: number;
  active: boolean;
}

export interface Education {
  id: number;
  school: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  current: boolean;
  detail: string;
  order: number;
  active: boolean;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  issue_date: string;
  credential_url: string;
  order: number;
  active: boolean;
}

export interface SocialLink {
  id: number;
  label: string;
  url: string;
  icon: string;
  order: number;
  active: boolean;
}

export interface ProjectFeature {
  text: string;
  status: StatusKind | string;
  order?: number;
}

export interface CaseStudyData {
  architecture_text: string;
  challenges: string[];
  solutions: string[];
  results: string[];
  lessons: string[];
  decisions: string[];
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  status: StatusKind | string;
  description: string;
  problem: string;
  solution: string;
  role: string;
  architecture: string;
  image_url: string;
  github_url: string;
  demo_url: string;
  featured: boolean;
  published: boolean;
  order: number;
  started_at: string;
  technologies: string[];
  features: ProjectFeature[];
  case_study?: CaseStudyData | null;
}

export interface SiteContent {
  profile: Profile | null;
  skills: SkillGroup[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  social_links: SocialLink[];
  projects: Project[];
  meta?: { title?: string | null; description?: string | null };
}

export interface ResumeContactLine {
  kind: string;
  value: string;
}

export interface ResumeItem {
  name?: string;
  tagline?: string;
  status?: string;
  role?: string;
  technologies?: string[];
  highlights?: { text: string; status?: string }[];
}

export interface ResumeVersionMeta {
  slug: string;
  title: string;
  target_role: string;
  is_default: boolean;
}

export interface ResumePayload {
  profile: {
    name: string;
    title: string;
    brand: string;
    photo: string;
  } | null;
  resume: {
    email: string;
    phone: string;
    location: string;
    website: string;
    references_note: string;
  };
  version: { slug: string; title: string } | null;
  versions: ResumeVersionMeta[];
  contact_lines: ResumeContactLine[];
  summary: string;
  skills: { name: string; category: string; categoryLabel: string }[];
  experience: {
    title: string;
    organization: string;
    employment_type: string;
    location: string;
    start_date: string;
    end_date: string;
    current: boolean;
    bullets: string[];
  }[];
  education: {
    school: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
    current: boolean;
    detail: string;
  }[];
  certifications: { name: string; issuer: string; issue_date: string; url: string }[];
  projects: ResumeItem[];
  links: { label: string; url: string }[];
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
}

export interface MatchAnalysis {
  score: number;
  band: "strong" | "good" | "fair" | "low";
  note: string;
  breakdown: Record<string, { requested: number; matched: number; score: number | null }>;
  matched: string[];
  missing: string[];
  keywords: string[];
  recommendations: string[];
  provider?: string;
}

export interface ApiErrorPayload {
  code: string;
  detail: string;
}

export interface ApiResult<T> {
  ok: true;
  data: T;
}

export type ApiFail = { ok: false; error: ApiErrorPayload; status: number };

export type Api<T> = ApiResult<T> | ApiFail;