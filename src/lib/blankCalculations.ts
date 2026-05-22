import type { BlankCalculationResult, BlankOptions, CalculationResult, CalculatorConfig, ThicknessZone } from '../types';
import { getMaterialDensity } from './calculations';

interface ThicknessReductionTemplate {
  id: string;
  label: string;
  reductionPercent: number;
  radialStartRatio: number;
  radialEndRatio: number;
  color: string;
}

const TORISPHERICAL_THICKNESS_ZONES: ThicknessReductionTemplate[] = [
  { id: 'crown', label: 'Crown', reductionPercent: 3, radialStartRatio: 0, radialEndRatio: 0.45, color: '#38bdf8' },
  { id: 'crown-shoulder', label: 'Crown shoulder', reductionPercent: 7, radialStartRatio: 0.45, radialEndRatio: 0.68, color: '#22c55e' },
  { id: 'knuckle', label: 'Knuckle', reductionPercent: 12, radialStartRatio: 0.68, radialEndRatio: 0.86, color: '#f97316' },
  { id: 'straight-flange', label: 'Straight flange', reductionPercent: 4, radialStartRatio: 0.86, radialEndRatio: 1, color: '#a78bfa' },
];

const ELLIPSOIDAL_THICKNESS_ZONES: ThicknessReductionTemplate[] = [
  { id: 'crown', label: 'Crown', reductionPercent: 4, radialStartRatio: 0, radialEndRatio: 0.45, color: '#38bdf8' },
  { id: 'crown-shoulder', label: 'Crown shoulder', reductionPercent: 8, radialStartRatio: 0.45, radialEndRatio: 0.68, color: '#22c55e' },
  { id: 'knuckle', label: 'Knuckle', reductionPercent: 14, radialStartRatio: 0.68, radialEndRatio: 0.86, color: '#ef4444' },
  { id: 'straight-flange', label: 'Straight flange', reductionPercent: 5, radialStartRatio: 0.86, radialEndRatio: 1, color: '#a78bfa' },
];

export const roundUpToStep = (value: number, step: number) => Math.ceil(value / step) * step;

export const getDefaultTrimAllowance = (diameterOuter: number) => Math.max(10, 0.005 * diameterOuter);

const getThicknessTemplates = (standard: CalculatorConfig['standard']) =>
  standard === 'DIN28013' ? ELLIPSOIDAL_THICKNESS_ZONES : TORISPHERICAL_THICKNESS_ZONES;

const calculateAreaWeight = (areaMm2: number, thickness: number, density: number) => {
  const volumeMm3 = areaMm2 * thickness;
  return (volumeMm3 / 1_000_000) * density;
};

export const calculateBlank = (
  config: CalculatorConfig,
  calculated: CalculationResult,
  options: BlankOptions,
): BlankCalculationResult => {
  const density = getMaterialDensity(config.material);
  const baseBlankDiameter = calculated.blankDiameter;
  const requiredDiscDiameter = roundUpToStep(baseBlankDiameter + 2 * options.trimAllowanceRadial, options.roundingStep);
  const minimumSquareSheetSide = requiredDiscDiameter;
  const recommendedSquareSheetSide = roundUpToStep(requiredDiscDiameter + 2 * options.cuttingClearance, options.roundingStep);
  const blankDiscAreaMm2 = Math.PI * (requiredDiscDiameter / 2) ** 2;
  const recommendedSquareSheetAreaMm2 = recommendedSquareSheetSide ** 2;
  const wasteAreaMm2 = Math.max(0, recommendedSquareSheetAreaMm2 - blankDiscAreaMm2);
  const wastePercent = recommendedSquareSheetAreaMm2 > 0 ? (wasteAreaMm2 / recommendedSquareSheetAreaMm2) * 100 : 0;
  const blankWeight = calculateAreaWeight(blankDiscAreaMm2, config.thickness, density);
  const recommendedSquareSheetWeight = calculateAreaWeight(recommendedSquareSheetAreaMm2, config.thickness, density);

  const thicknessZones: ThicknessZone[] = getThicknessTemplates(config.standard).map((zone) => ({
    ...zone,
    finalThickness: config.thickness * (1 - zone.reductionPercent / 100),
  }));

  const minThicknessZone = thicknessZones.reduce((minimum, zone) =>
    zone.finalThickness < minimum.finalThickness ? zone : minimum,
  );
  const estimatedMinimumThickness = minThicknessZone.finalThickness;
  const qcMinimumThickness = config.thickness - calculated.tolerances.thicknessMin;
  const maxReduction = minThicknessZone.reductionPercent / 100;
  const suggestedStartingThicknessForFinalNominal = roundUpToStep(config.thickness / (1 - maxReduction), 0.5);

  const warnings: string[] = [
    'Engineering v1 estimate only. Confirm blank size and thinning with the forming supplier before release.',
  ];

  if (estimatedMinimumThickness < qcMinimumThickness) {
    warnings.push(
      `Estimated minimum thickness ${estimatedMinimumThickness.toFixed(2)} mm is below the QC minimum ${qcMinimumThickness.toFixed(2)} mm.`,
    );
  }

  return {
    baseBlankDiameter,
    requiredDiscDiameter,
    minimumSquareSheetSide,
    recommendedSquareSheetSide,
    blankDiscAreaMm2,
    recommendedSquareSheetAreaMm2,
    wasteAreaMm2,
    wastePercent,
    blankWeight,
    recommendedSquareSheetWeight,
    thicknessZones,
    minThicknessZone,
    estimatedMinimumThickness,
    qcMinimumThickness,
    suggestedStartingThicknessForFinalNominal,
    warnings,
  };
};
