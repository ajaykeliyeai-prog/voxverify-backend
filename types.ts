
export type DetectionClassification = 'AI_GENERATED' | 'HUMAN';

export interface DetectionResult {
  classification: DetectionClassification;
  confidence: number;
  language: string;
  explanation: string;
  timestamp: number;
}

export type SupportedLanguage = 'English' | 'Tamil' | 'Hindi' | 'Malayalam' | 'Telugu';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'English',
  'Tamil',
  'Hindi',
  'Malayalam',
  'Telugu'
];
