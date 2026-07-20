import type { BlankOptionsForm, CalculatorForm, EdgePrep, EdgePrepSide, HeadStandard, NozzleForm } from './types';

/**
 * Share-link protocol (cadautoscript.com issue #113).
 *
 * When embedded in the utility shell, the app announces support, streams its
 * input forms (debounced), and restores them from a shared `?calc=` URL
 * forwarded by the shell. Only raw form inputs are serialized — validation and
 * calculation always re-run after restore, so a hand-edited link can never
 * show results the engine wouldn't produce.
 */

const MESSAGE_SUPPORT = 'cas:share-support';
const MESSAGE_RESTORE = 'cas:restore-state';
const MESSAGE_UPDATE = 'cas:state-update';
const SCHEMA_VERSION = 1;
const UPDATE_DEBOUNCE_MS = 300;
const MAX_NOZZLES = 20;

export type SharedState = {
  form: CalculatorForm;
  blankForm: BlankOptionsForm;
  nozzles: Array<Pick<NozzleForm, 'size' | 'offset'>>;
};

const HEAD_STANDARDS: HeadStandard[] = ['DIN28011', 'DIN28013', 'SS895'];
const EDGE_PREPS: EdgePrep[] = ['None', 'V-Bevel'];
const EDGE_PREP_SIDES: EdgePrepSide[] = ['single', 'double'];

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length <= 40 ? value : fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * Rebuilds the forms from untrusted link state: unknown keys are dropped,
 * enums are whitelisted, free-text fields are length-capped strings. Field
 * values themselves stay raw — `validateForm` treats them exactly like typed
 * input.
 */
function sanitize(
  state: unknown,
  defaults: { form: CalculatorForm; blankForm: BlankOptionsForm },
): SharedState | null {
  if (!state || typeof state !== 'object') return null;
  const raw = state as { form?: unknown; blankForm?: unknown; nozzles?: unknown };
  if (!raw.form || typeof raw.form !== 'object') return null;
  const f = raw.form as Record<string, unknown>;
  const b = (raw.blankForm && typeof raw.blankForm === 'object' ? raw.blankForm : {}) as Record<string, unknown>;

  const form: CalculatorForm = {
    standard: oneOf(f.standard, HEAD_STANDARDS, defaults.form.standard),
    diameterOuter: str(f.diameterOuter, defaults.form.diameterOuter),
    thickness: str(f.thickness, defaults.form.thickness),
    straightFlange: str(f.straightFlange, defaults.form.straightFlange),
    material: str(f.material, defaults.form.material),
    edgePrep: oneOf(f.edgePrep, EDGE_PREPS, defaults.form.edgePrep),
    edgePrepSide: oneOf(f.edgePrepSide, EDGE_PREP_SIDES, defaults.form.edgePrepSide),
    bevelAngle: str(f.bevelAngle, defaults.form.bevelAngle),
    rootFace: str(f.rootFace, defaults.form.rootFace),
  };

  const blankForm: BlankOptionsForm = {
    trimAllowanceRadial: str(b.trimAllowanceRadial, defaults.blankForm.trimAllowanceRadial),
    cuttingClearance: str(b.cuttingClearance, defaults.blankForm.cuttingClearance),
    roundingStep: str(b.roundingStep, defaults.blankForm.roundingStep),
  };

  const nozzles: SharedState['nozzles'] = Array.isArray(raw.nozzles)
    ? raw.nozzles
        .slice(0, MAX_NOZZLES)
        .filter((n): n is Record<string, unknown> => Boolean(n) && typeof n === 'object')
        .map((n) => ({size: str(n.size, ''), offset: str(n.offset, '')}))
    : [];

  return {form, blankForm, nozzles};
}

let initialized = false;

export function initShareLink(options: {
  defaults: { form: CalculatorForm; blankForm: BlankOptionsForm };
  onRestore: (state: SharedState) => void;
}): void {
  if (initialized || typeof window === 'undefined' || window.parent === window) return;
  initialized = true;

  const origin = window.location.origin;

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== origin) return;
    const data: unknown = event.data;
    if (!data || typeof data !== 'object') return;
    const message = data as { type?: unknown; version?: unknown; state?: unknown };
    if (message.type === MESSAGE_RESTORE && message.version === SCHEMA_VERSION) {
      const sanitized = sanitize(message.state, options.defaults);
      if (sanitized) options.onRestore(sanitized);
    }
  });

  window.parent.postMessage({ type: MESSAGE_SUPPORT }, origin);
}

let updateTimer: number | undefined;

export function reportShareState(state: SharedState): void {
  if (!initialized) return;
  window.clearTimeout(updateTimer);
  updateTimer = window.setTimeout(() => {
    window.parent.postMessage(
      {
        type: MESSAGE_UPDATE,
        state: {
          form: state.form,
          blankForm: state.blankForm,
          nozzles: state.nozzles.map(({size, offset}) => ({size, offset})),
        },
      },
      window.location.origin,
    );
  }, UPDATE_DEBOUNCE_MS);
}
