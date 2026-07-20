import { describe, expect, it } from 'vitest';
import { calculateBlank, getDefaultTrimAllowance, roundUpToStep } from '../blankCalculations';
import { calculateGeometry } from '../calculations';
import type { BlankOptions, CalculatorConfig } from '../../types';

const config: CalculatorConfig = {
  standard: 'DIN28011',
  diameterOuter: 1000,
  thickness: 10,
  straightFlange: 40,
  material: 'P265GH Carbon Steel',
  edgePrep: 'None',
  edgePrepSide: 'single',
  bevelAngle: 30,
  rootFace: 2,
};

const options: BlankOptions = {
  trimAllowanceRadial: 15,
  cuttingClearance: 20,
  roundingStep: 10,
};

describe('roundUpToStep', () => {
  it('rounds up to the next multiple of the step', () => {
    expect(roundUpToStep(1201, 10)).toBe(1210);
    expect(roundUpToStep(1200, 10)).toBe(1200);
    expect(roundUpToStep(7.1, 0.5)).toBe(7.5);
  });
});

describe('getDefaultTrimAllowance', () => {
  it('uses 0.5% of the diameter with a 10 mm floor', () => {
    expect(getDefaultTrimAllowance(1000)).toBe(10);
    expect(getDefaultTrimAllowance(4000)).toBe(20);
    expect(getDefaultTrimAllowance(100)).toBe(10);
  });
});

describe('calculateBlank', () => {
  const geometry = calculateGeometry(config);
  const result = calculateBlank(config, geometry, options);

  it('derives the required disc from blank diameter + trim allowance, rounded up', () => {
    // 1170 + 2·15 = 1200, already on the 10 mm step.
    expect(result.requiredDiscDiameter).toBe(1200);
    expect(result.minimumSquareSheetSide).toBe(1200);
    // 1200 + 2·20 = 1240.
    expect(result.recommendedSquareSheetSide).toBe(1240);
  });

  it('computes waste as sheet area minus disc area', () => {
    const discArea = Math.PI * 600 ** 2;
    const sheetArea = 1240 ** 2;
    expect(result.blankDiscAreaMm2).toBeCloseTo(discArea, 6);
    expect(result.wasteAreaMm2).toBeCloseTo(sheetArea - discArea, 6);
    expect(result.wastePercent).toBeCloseTo(((sheetArea - discArea) / sheetArea) * 100, 6);
  });

  it('applies torispherical thinning zones for DIN 28011 with the knuckle thinnest', () => {
    expect(result.minThicknessZone.id).toBe('knuckle');
    expect(result.minThicknessZone.reductionPercent).toBe(12);
    expect(result.estimatedMinimumThickness).toBeCloseTo(10 * 0.88, 10);
  });

  it('applies deeper ellipsoidal thinning for DIN 28013', () => {
    const kb = calculateBlank({ ...config, standard: 'DIN28013' }, calculateGeometry({ ...config, standard: 'DIN28013' }), options);
    expect(kb.minThicknessZone.reductionPercent).toBe(14);
    expect(kb.estimatedMinimumThickness).toBeCloseTo(10 * 0.86, 10);
  });

  it('suggests a starting thickness that survives the worst-case thinning, on a 0.5 mm step', () => {
    // 10 / (1 - 0.12) = 11.36… → 11.5
    expect(result.suggestedStartingThicknessForFinalNominal).toBe(11.5);
  });

  it('warns when estimated thinning drops below the QC minimum', () => {
    // QC minimum = 10 − 0.3 = 9.7; estimated 8.8 → warning expected.
    expect(result.qcMinimumThickness).toBeCloseTo(9.7, 10);
    expect(result.warnings.some((w) => w.includes('below the QC minimum'))).toBe(true);
  });

  it('always carries the supplier-confirmation disclaimer', () => {
    expect(result.warnings[0]).toMatch(/Confirm blank size/);
  });
});
