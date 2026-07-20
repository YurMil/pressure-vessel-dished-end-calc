import { describe, expect, it } from 'vitest';
import { validateForm } from '../validation';
import type { BlankOptionsForm, CalculatorForm } from '../../types';

const baseForm: CalculatorForm = {
  standard: 'DIN28011',
  diameterOuter: '1000',
  thickness: '10',
  straightFlange: '40',
  material: 'P265GH Carbon Steel',
  edgePrep: 'None',
  edgePrepSide: 'single',
  bevelAngle: '30',
  rootFace: '2',
};

const blankForm: BlankOptionsForm = {
  trimAllowanceRadial: '15',
  cuttingClearance: '20',
  roundingStep: '10',
};

const form = (overrides: Partial<CalculatorForm> = {}): CalculatorForm => ({ ...baseForm, ...overrides });

describe('validateForm — config', () => {
  it('accepts a valid form and builds a numeric config', () => {
    const result = validateForm(form(), [], blankForm);
    expect(result.isValid).toBe(true);
    expect(result.config).toMatchObject({ diameterOuter: 1000, thickness: 10, straightFlange: 40 });
  });

  it('rejects non-numeric and non-positive diameters', () => {
    expect(validateForm(form({ diameterOuter: 'abc' }), []).configErrors.diameterOuter).toBeTruthy();
    expect(validateForm(form({ diameterOuter: '0' }), []).configErrors.diameterOuter).toBeTruthy();
    expect(validateForm(form({ diameterOuter: '-100' }), []).configErrors.diameterOuter).toBeTruthy();
  });

  it('rejects thickness at or above half the outer diameter', () => {
    expect(validateForm(form({ thickness: '500' }), []).configErrors.thickness).toBeTruthy();
    expect(validateForm(form({ thickness: '499' }), []).configErrors.thickness).toBeUndefined();
  });

  it('requires at least 10 mm of straight flange', () => {
    expect(validateForm(form({ straightFlange: '9' }), []).configErrors.straightFlange).toBeTruthy();
    expect(validateForm(form({ straightFlange: '10' }), []).configErrors.straightFlange).toBeUndefined();
  });

  it('validates bevel fields only when edge prep is enabled', () => {
    const noPrep = validateForm(form({ bevelAngle: '99', rootFace: '99' }), []);
    expect(noPrep.isValid).toBe(true);

    const withPrep = validateForm(form({ edgePrep: 'V-Bevel', bevelAngle: '85', rootFace: '2' }), []);
    expect(withPrep.configErrors.bevelAngle).toBeTruthy();

    const rootTooThick = validateForm(form({ edgePrep: 'V-Bevel', bevelAngle: '30', rootFace: '10' }), []);
    expect(rootTooThick.configErrors.rootFace).toBeTruthy();
  });
});

describe('validateForm — nozzles', () => {
  it('rejects offsets outside the visual radius limit', () => {
    // Limit = Da/2 − s = 490 mm.
    const outside = validateForm(form(), [{ id: 'n1', size: 'DN50', offset: '491' }]);
    expect(outside.nozzleErrors.n1).toBeTruthy();
    expect(outside.isValid).toBe(false);

    const inside = validateForm(form(), [{ id: 'n1', size: 'DN50', offset: '-490' }]);
    expect(inside.nozzleErrors.n1).toBeUndefined();
    expect(inside.nozzles).toHaveLength(1);
    expect(inside.nozzles[0].offset).toBe(-490);
  });

  it('rejects non-numeric offsets', () => {
    const result = validateForm(form(), [{ id: 'n1', size: 'DN50', offset: 'oops' }]);
    expect(result.nozzleErrors.n1).toBeTruthy();
  });
});

describe('validateForm — blank options', () => {
  it('falls back to the default trim allowance when the field is empty', () => {
    const result = validateForm(form(), [], { ...blankForm, trimAllowanceRadial: '' });
    expect(result.isBlankValid).toBe(true);
    expect(result.blankOptions?.trimAllowanceRadial).toBe(10); // max(10, 0.5% of 1000)
  });

  it('rejects negative allowances and non-positive rounding steps', () => {
    expect(validateForm(form(), [], { ...blankForm, trimAllowanceRadial: '-1' }).isBlankValid).toBe(false);
    expect(validateForm(form(), [], { ...blankForm, cuttingClearance: '-1' }).isBlankValid).toBe(false);
    expect(validateForm(form(), [], { ...blankForm, roundingStep: '0' }).isBlankValid).toBe(false);
  });

  it('marks blank options invalid while the main config is invalid', () => {
    const result = validateForm(form({ diameterOuter: '0' }), [], blankForm);
    expect(result.isBlankValid).toBe(false);
  });
});
