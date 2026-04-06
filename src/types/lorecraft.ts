export type LorcraftArea =
  | '역사와 배경'
  | '지리와 공간'
  | '사회 구조와 계층'
  | '조직과 세력'
  | '기술/마법 체계'
  | '문화와 일상'
  | '주요 인물'
  | '사건과 갈등 구조';

export interface LorcraftInput {
  background: string;
  genre: string;
  existingSetting?: string;
  areas: LorcraftArea[];
}

export interface NormalizedLorcraftInput {
  background: string;
  genre: string;
  existingSetting: string;
  areas: LorcraftArea[];
}

export interface AnalyzeResult {
  setting_type: 'real' | 'fictional' | 'hybrid';
  priority_axes: string[];
  genre_tone: string;
  research_needs: string[];
  fictional_elements: string[];
}

export interface PlanSection {
  title: string;
  area: string;
  type: 'real' | 'fictional' | 'hybrid';
  focus: string;
  key_points: string[];
}

export interface PlanResult {
  sections: PlanSection[];
}

export interface ResearchSource {
  topic: string;
  facts: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ResearchResult {
  sources_summary: ResearchSource[];
  gaps: string[];
  creative_flex_points: string[];
}

export interface SynthesizeSection {
  title: string;
  key_points: string[];
  tone_hints: string;
  connections: string[];
}

export interface SynthesizeResult {
  sections: SynthesizeSection[];
}

export type ReviewResult = SynthesizeResult;

export interface FormatSection {
  title: string;
  content: string;
}

export interface LorcraftPayload {
  background: string;
  genre: string;
  areas: LorcraftArea[];
  sections: FormatSection[];
  generated_at: string;
}
