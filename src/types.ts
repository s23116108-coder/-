export interface OrthographicGuide {
  id: string;
  name: string;
  yPercent: number; // 0 to 100% from top
  color: string;
  description: string;
}

export interface CharacterColor {
  name: string;
  hex: string;
  role: string;
  percentage: string;
}

export interface AnatomicalFeature {
  id: string;
  name: string;
  nameEn: string;
  xPercent: number;
  yPercent: number;
  description: string;
  targetView: 'turnaround' | 'front' | 'side' | 'hero';
}

export type ArtStyle = 'crossy_road' | 'realistic';
export type ViewFilterMode = 'normal' | 'silhouette' | 'blueprint' | 'high_contrast';
export type ActiveTab = 'game' | 'turnaround' | 'turntable3d' | 'views_breakdown' | 'specs';
