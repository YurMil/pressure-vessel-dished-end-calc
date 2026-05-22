import { DEFAULT_NOZZLE } from '../constants';
import { getDefaultTrimAllowance } from './blankCalculations';
import type { BlankOptions, BlankOptionsForm, CalculatorConfig, CalculatorForm, NozzleForm, ParsedNozzle, ValidationResult } from '../types';

const parsePositiveNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildConfig = (form: CalculatorForm): ValidationResult['config'] => {
  const diameterOuter = Number(form.diameterOuter);
  const thickness = Number(form.thickness);
  const straightFlange = Number(form.straightFlange);
  const bevelAngle = Number(form.bevelAngle);
  const rootFace = Number(form.rootFace);

  return {
    standard: form.standard,
    diameterOuter,
    thickness,
    straightFlange,
    material: form.material,
    edgePrep: form.edgePrep,
    bevelAngle,
    rootFace,
  };
};

const validateBlankOptions = (form: BlankOptionsForm | undefined, diameterOuter: number | null) => {
  const blankErrors: ValidationResult['blankErrors'] = {};

  if (!form || diameterOuter === null || diameterOuter <= 0) {
    return { blankOptions: null, blankErrors, isBlankValid: false };
  }

  const parsedTrimAllowance = form.trimAllowanceRadial.trim() === '' ? getDefaultTrimAllowance(diameterOuter) : Number(form.trimAllowanceRadial);
  const parsedCuttingClearance = Number(form.cuttingClearance);
  const parsedRoundingStep = Number(form.roundingStep);

  if (!Number.isFinite(parsedTrimAllowance) || parsedTrimAllowance < 0) {
    blankErrors.trimAllowanceRadial = 'Trim allowance must be zero or greater.';
  }

  if (!Number.isFinite(parsedCuttingClearance) || parsedCuttingClearance < 0) {
    blankErrors.cuttingClearance = 'Cutting clearance must be zero or greater.';
  }

  if (!Number.isFinite(parsedRoundingStep) || parsedRoundingStep <= 0) {
    blankErrors.roundingStep = 'Rounding step must be greater than zero.';
  }

  const isBlankValid = Object.keys(blankErrors).length === 0;
  const blankOptions: BlankOptions | null = isBlankValid
    ? {
        trimAllowanceRadial: parsedTrimAllowance,
        cuttingClearance: parsedCuttingClearance,
        roundingStep: parsedRoundingStep,
      }
    : null;

  return { blankOptions, blankErrors, isBlankValid };
};

export const validateForm = (form: CalculatorForm, nozzleForms: NozzleForm[], blankForm?: BlankOptionsForm): ValidationResult => {
  const configErrors: ValidationResult['configErrors'] = {};

  const diameterOuter = parsePositiveNumber(form.diameterOuter);
  if (diameterOuter === null || diameterOuter <= 0) {
    configErrors.diameterOuter = 'Outer diameter must be greater than 0 mm.';
  }

  const thickness = parsePositiveNumber(form.thickness);
  if (thickness === null || thickness <= 0) {
    configErrors.thickness = 'Thickness must be greater than 0 mm.';
  } else if (diameterOuter !== null && thickness >= diameterOuter / 2) {
    configErrors.thickness = 'Thickness must stay below half of the outer diameter.';
  }

  const straightFlange = parsePositiveNumber(form.straightFlange);
  if (straightFlange === null || straightFlange < 10) {
    configErrors.straightFlange = 'Straight flange must be at least 10 mm.';
  }

  if (form.edgePrep !== 'None') {
    const bevelAngle = parsePositiveNumber(form.bevelAngle);
    if (bevelAngle === null || bevelAngle <= 0 || bevelAngle >= 90) {
      configErrors.bevelAngle = 'Bevel angle must be between 0 and 90 degrees.';
    }

    const rootFace = parsePositiveNumber(form.rootFace);
    if (rootFace === null || rootFace <= 0) {
      configErrors.rootFace = 'Root face must be greater than 0 mm.';
    } else if (thickness !== null && rootFace >= thickness) {
      configErrors.rootFace = 'Root face must stay below the wall thickness.';
    }
  }

  const config = Object.keys(configErrors).length === 0 ? (buildConfig(form) as CalculatorConfig) : null;
  const nozzleErrors: ValidationResult['nozzleErrors'] = {};
  const nozzles: ParsedNozzle[] = [];

  nozzleForms.forEach((nozzle) => {
    const parsedOffset = Number(nozzle.offset);
    const visualLimit = diameterOuter !== null && thickness !== null ? Math.max(0, diameterOuter / 2 - thickness) : null;

    if (!Number.isFinite(parsedOffset)) {
      nozzleErrors[nozzle.id] = 'Offset must be a valid number.';
      return;
    }

    if (visualLimit !== null && Math.abs(parsedOffset) > visualLimit) {
      nozzleErrors[nozzle.id] = `Offset must stay within +/-${visualLimit.toFixed(0)} mm.`;
      return;
    }

    nozzles.push({
      id: nozzle.id,
      size: nozzle.size || DEFAULT_NOZZLE.size,
      offset: parsedOffset,
    });
  });

  const isValid = config !== null && Object.keys(nozzleErrors).length === 0;
  const { blankOptions, blankErrors, isBlankValid } = validateBlankOptions(blankForm, diameterOuter);

  return {
    config,
    configErrors,
    nozzles,
    nozzleErrors,
    blankOptions,
    blankErrors,
    isValid,
    isBlankValid: isValid && isBlankValid,
  };
};
