import type { CalculationResult, CalculatorConfig, Tolerances } from '../types';

export const getMaterialDensity = (material: string) => {
  if (material.includes('Titanium')) return 4.51;
  if (material.includes('Duplex')) return 7.8;
  if (material.includes('Stainless')) return 7.9;
  return 7.85;
};

export const getTolerances = (diameterOuter: number): Tolerances => {
  let daTol = 0;
  if (diameterOuter <= 500) daTol = 2;
  else if (diameterOuter <= 1200) daTol = 3;
  else if (diameterOuter <= 2000) daTol = 4;
  else daTol = Math.ceil(diameterOuter * 0.003);

  return {
    daPlus: daTol,
    daMinus: daTol,
    hPlus: 10,
    hMinus: 0,
    ovality: Math.ceil(diameterOuter * 0.01),
    thicknessMin: 0.3,
  };
};

export const calculateGeometry = (config: CalculatorConfig): CalculationResult => {
  const { diameterOuter: diameter, thickness, standard, straightFlange } = config;

  let crownRadius = 0;
  let knuckleRadius = 0;
  let dishDepth = 0;
  let blankDiameterFactor = 1;

  if (standard === 'DIN28011') {
    crownRadius = diameter;
    knuckleRadius = 0.1 * diameter;
    dishDepth = 0.1935 * diameter - 0.455 * thickness;
    blankDiameterFactor = 1.09;
  } else if (standard === 'DIN28013') {
    crownRadius = 0.8 * diameter;
    knuckleRadius = 0.154 * diameter;
    dishDepth = 0.255 * diameter - 0.635 * thickness;
    blankDiameterFactor = 1.14;
  } else if (standard === 'SS895') {
    crownRadius = diameter;
    knuckleRadius = 0.1 * diameter;
    dishDepth = 0.1935 * diameter;
    blankDiameterFactor = 1.09;
  }

  const totalHeight = straightFlange + dishDepth + thickness;
  const blankDiameter = blankDiameterFactor * diameter + 2 * straightFlange;
  const surfaceAreaMm2 = Math.PI * (blankDiameter / 2) ** 2;
  const volumeMm3 = surfaceAreaMm2 * thickness;
  const density = getMaterialDensity(config.material);
  const weight = (volumeMm3 / 1_000_000) * density;

  return {
    R: crownRadius,
    r: knuckleRadius,
    h2: dishDepth,
    totalHeight,
    weight,
    blankDiameter,
    tolerances: getTolerances(diameter),
  };
};

export const calculateApproxVolume = (config: CalculatorConfig, totalHeight: number) => {
  const cylinderApprox = totalHeight * Math.PI * (config.diameterOuter / 2) ** 2;
  return (cylinderApprox / 1e9) * 0.7;
};
