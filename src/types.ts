export type HeadStandard = 'DIN28011' | 'DIN28013' | 'SS895';
export type EdgePrep = 'None' | 'V-Bevel';

export interface CalculatorConfig {
  standard: HeadStandard;
  diameterOuter: number;
  thickness: number;
  straightFlange: number;
  material: string;
  edgePrep: EdgePrep;
  bevelAngle: number;
  rootFace: number;
}

export interface CalculatorForm {
  standard: HeadStandard;
  diameterOuter: string;
  thickness: string;
  straightFlange: string;
  material: string;
  edgePrep: EdgePrep;
  bevelAngle: string;
  rootFace: string;
}

export interface NozzleForm {
  id: string;
  size: string;
  offset: string;
}

export interface BlankOptionsForm {
  trimAllowanceRadial: string;
  cuttingClearance: string;
  roundingStep: string;
}

export interface BlankOptions {
  trimAllowanceRadial: number;
  cuttingClearance: number;
  roundingStep: number;
}

export interface Tolerances {
  daPlus: number;
  daMinus: number;
  hPlus: number;
  hMinus: number;
  ovality: number;
  thicknessMin: number;
}

export interface CalculationResult {
  R: number;
  r: number;
  h2: number;
  totalHeight: number;
  weight: number;
  blankDiameter: number;
  tolerances: Tolerances;
}

export interface ParsedNozzle {
  id: string;
  size: string;
  offset: number;
}

export interface ThicknessZone {
  id: string;
  label: string;
  reductionPercent: number;
  finalThickness: number;
  radialStartRatio: number;
  radialEndRatio: number;
  color: string;
}

export interface BlankCalculationResult {
  baseBlankDiameter: number;
  requiredDiscDiameter: number;
  minimumSquareSheetSide: number;
  recommendedSquareSheetSide: number;
  blankDiscAreaMm2: number;
  recommendedSquareSheetAreaMm2: number;
  wasteAreaMm2: number;
  wastePercent: number;
  blankWeight: number;
  recommendedSquareSheetWeight: number;
  thicknessZones: ThicknessZone[];
  minThicknessZone: ThicknessZone;
  estimatedMinimumThickness: number;
  qcMinimumThickness: number;
  suggestedStartingThicknessForFinalNominal: number;
  warnings: string[];
}

export interface ValidationResult {
  config: CalculatorConfig | null;
  configErrors: Partial<Record<keyof CalculatorForm, string>>;
  nozzles: ParsedNozzle[];
  nozzleErrors: Record<string, string | undefined>;
  blankOptions: BlankOptions | null;
  blankErrors: Partial<Record<keyof BlankOptionsForm, string>>;
  isValid: boolean;
  isBlankValid: boolean;
}
