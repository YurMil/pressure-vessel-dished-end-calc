import type { BlankOptionsForm, CalculatorForm, EdgePrepSide, NozzleForm } from './types';

export const APP_VERSION = '1.0.0';

export const MATERIALS = [
  'P265GH (1.0425)',
  'P295GH (1.0481)',
  '16Mo3 (1.5415)',
  'P355NH (1.0565)',
  'Stainless 304L (1.4307)',
  'Stainless 316L (1.4404)',
  'Duplex 2205 (1.4462)',
  'Titanium Gr.2',
] as const;

export const NOZZLE_SIZES = ['DN15', 'DN25', 'DN40', 'DN50', 'DN80', 'DN100', 'DN150', 'DN200', 'DN300', 'DN400', 'DN500'] as const;

export const EDGE_PREP_SIDES: Array<{ value: EdgePrepSide; label: string }> = [
  { value: 'single', label: 'Single side' },
  { value: 'double', label: 'Double side' },
];

export const DEFAULT_FORM: CalculatorForm = {
  standard: 'DIN28011',
  diameterOuter: '1000',
  thickness: '8',
  straightFlange: '25',
  material: MATERIALS[0],
  edgePrep: 'None',
  edgePrepSide: 'single',
  bevelAngle: '30',
  rootFace: '2',
};

export const DEFAULT_NOZZLE: Omit<NozzleForm, 'id'> = {
  size: 'DN50',
  offset: '0',
};

export const DEFAULT_BLANK_OPTIONS_FORM: BlankOptionsForm = {
  trimAllowanceRadial: '',
  cuttingClearance: '10',
  roundingStep: '5',
};
