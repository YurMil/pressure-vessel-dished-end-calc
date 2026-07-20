import { describe, expect, it } from 'vitest';
import { calculateApproxVolume, calculateGeometry, getMaterialDensity, getTolerances } from '../calculations';
import type { CalculatorConfig } from '../../types';

const baseConfig: CalculatorConfig = {
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

describe('getMaterialDensity', () => {
  it('maps material families to densities in g/cm³', () => {
    expect(getMaterialDensity('Titanium Grade 2')).toBe(4.51);
    expect(getMaterialDensity('Duplex 2205')).toBe(7.8);
    expect(getMaterialDensity('Stainless 316L')).toBe(7.9);
    expect(getMaterialDensity('P265GH Carbon Steel')).toBe(7.85);
    expect(getMaterialDensity('')).toBe(7.85);
  });
});

describe('getTolerances', () => {
  it('steps the outer-diameter tolerance by size band', () => {
    expect(getTolerances(500).daPlus).toBe(2);
    expect(getTolerances(501).daPlus).toBe(3);
    expect(getTolerances(1200).daPlus).toBe(3);
    expect(getTolerances(1201).daPlus).toBe(4);
    expect(getTolerances(2000).daPlus).toBe(4);
    // Above 2000: 0.3% rounded up — 2500 * 0.003 = 7.5 → 8.
    expect(getTolerances(2500).daPlus).toBe(8);
  });

  it('derives ovality as 1% of diameter rounded up and fixes the height band', () => {
    const tol = getTolerances(1150);
    expect(tol.ovality).toBe(12); // ceil(11.5)
    expect(tol.hPlus).toBe(10);
    expect(tol.hMinus).toBe(0);
    expect(tol.thicknessMin).toBe(0.3);
  });
});

describe('calculateGeometry — DIN 28011 (Klöpper / torispherical)', () => {
  const result = calculateGeometry(baseConfig);

  it('uses R = Da and r = 0.1·Da', () => {
    expect(result.R).toBe(1000);
    expect(result.r).toBe(100);
  });

  it('computes dish depth h2 = 0.1935·Da − 0.455·s', () => {
    // 0.1935 * 1000 - 0.455 * 10 = 188.95
    expect(result.h2).toBeCloseTo(188.95, 10);
  });

  it('computes total height = straight flange + dish depth + thickness', () => {
    expect(result.totalHeight).toBeCloseTo(40 + 188.95 + 10, 10);
  });

  it('computes blank diameter = 1.09·Da + 2·straight flange', () => {
    expect(result.blankDiameter).toBeCloseTo(1.09 * 1000 + 80, 10);
  });

  it('computes weight from the blank disc volume and material density', () => {
    // π·(1170/2)²·10 mm³ → cm³·7.85 g/cm³ → kg
    const expected = (Math.PI * 585 ** 2 * 10 / 1_000_000) * 7.85;
    expect(result.weight).toBeCloseTo(expected, 6);
  });
});

describe('calculateGeometry — DIN 28013 (Korbbogen / semi-ellipsoidal)', () => {
  const result = calculateGeometry({ ...baseConfig, standard: 'DIN28013' });

  it('uses R = 0.8·Da and r = 0.154·Da', () => {
    expect(result.R).toBeCloseTo(800, 10);
    expect(result.r).toBeCloseTo(154, 10);
  });

  it('computes dish depth h2 = 0.255·Da − 0.635·s', () => {
    // 0.255 * 1000 - 0.635 * 10 = 248.65
    expect(result.h2).toBeCloseTo(248.65, 10);
  });

  it('uses the deeper 1.14 blank factor', () => {
    expect(result.blankDiameter).toBeCloseTo(1.14 * 1000 + 80, 10);
  });
});

describe('calculateGeometry — SS 895', () => {
  it('matches Klöpper proportions but ignores thickness in the dish depth', () => {
    const result = calculateGeometry({ ...baseConfig, standard: 'SS895' });
    expect(result.R).toBe(1000);
    expect(result.r).toBe(100);
    expect(result.h2).toBeCloseTo(193.5, 10);
  });
});

describe('calculateApproxVolume', () => {
  it('approximates 70% of the enclosing cylinder in m³', () => {
    const totalHeight = 238.95;
    const expected = ((totalHeight * Math.PI * 500 ** 2) / 1e9) * 0.7;
    expect(calculateApproxVolume(baseConfig, totalHeight)).toBeCloseTo(expected, 10);
  });
});
