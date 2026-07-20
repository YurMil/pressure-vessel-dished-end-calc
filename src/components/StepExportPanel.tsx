import { useMemo, useState } from 'react';
import { useVesselHeadCad } from '../cad/hooks/useVesselHeadCad';
import type { CadWorkerProgressMessage } from '../cad/services/cad-worker-protocol';
import type { HeadCadConfig } from '../cad/types/cad-types';
import type { CadNozzle, CalculatorConfig, ParsedNozzle } from '../types';
import { Icon } from './Icon';

interface StepExportPanelProps {
  config: CalculatorConfig;
  nozzles: ParsedNozzle[];
  isEnabled: boolean;
}

const getProgressLabel = (message: CadWorkerProgressMessage) => {
  if (message.stage === 'init') {
    return message.done >= message.total ? 'CAD kernel ready.' : 'Initializing CAD kernel...';
  }

  if (message.stage === 'export') {
    return message.done >= message.total ? 'STEP export complete.' : 'Exporting STEP...';
  }

  const progressLabel = message.total > 0 ? ` (${Math.min(message.done, message.total)}/${message.total})` : '';
  return `Building head geometry...${progressLabel}`;
};

const downloadStepFile = (stepBuffer: ArrayBuffer, config: HeadCadConfig) => {
  const blob = new Blob([stepBuffer], { type: 'application/step' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `vessel-head_${config.standard.toLowerCase()}_${Math.round(config.diameterOuter)}mm.step`;
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
};

const toCadNozzles = (nozzles: ParsedNozzle[]): CadNozzle[] => nozzles.map((nozzle) => ({ ...nozzle, type: 'PN16' }));

export function StepExportPanel({ config, nozzles, isEnabled }: StepExportPanelProps) {
  const { workerStatus, workerError, generateStep } = useVesselHeadCad();
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  const cadConfig = useMemo<HeadCadConfig>(
    () => ({
      ...config,
      includeEdgePrep: config.edgePrep !== 'None',
      includeNozzles: nozzles.length > 0,
    }),
    [config, nozzles.length],
  );

  const handleDownloadStep = async () => {
    setIsGenerating(true);
    setErrorText(null);
    setSuccessText(null);
    setStatusText('Initializing CAD kernel...');

    try {
      const step = await generateStep(cadConfig, toCadNozzles(nozzles), {
        onProgress: (message) => {
          setStatusText(getProgressLabel(message));
        },
      });

      downloadStepFile(step, cadConfig);
      setSuccessText('STEP file generated successfully.');
      setStatusText('Done');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorText(message);
      setStatusText('');
    } finally {
      setIsGenerating(false);
    }
  };

  const helperText = (() => {
    if (isGenerating) {
      return statusText || 'Processing vessel head geometry in the browser...';
    }

    if (workerStatus === 'warming') {
      return 'CAD kernel is warming up in the background...';
    }

    if (successText) {
      return successText;
    }

    return 'Axisymmetric head geometry is generated in a Web Worker and exported as a 3D STEP file.';
  })();

  return (
    <section className="card step-export-panel">
      <div className="section-title section-title--between">
        <span className="section-title__group">
          <Icon name="box" size={18} />
          <span>3D STEP Export</span>
        </span>
      </div>

      <p className="step-export-panel__helper">{helperText}</p>

      <button type="button" className="button button--primary step-export-panel__button" onClick={handleDownloadStep} disabled={!isEnabled || isGenerating}>
        <Icon name={isGenerating ? 'loader' : 'download'} size={18} className={isGenerating ? 'spin-icon' : ''} />
        <span>{isGenerating ? 'Generating 3D STEP...' : 'Download .STEP (3D)'}</span>
      </button>

      {errorText || workerError ? <div className="step-export-panel__error">{errorText ?? workerError}</div> : null}

      {nozzles.length > 0 ? (
        <div className="step-export-panel__warning">Nozzles are tracked in the UI, but the current STEP MVP exports the base head without nozzle cuts.</div>
      ) : null}

      {config.edgePrep !== 'None' ? (
        <div className="step-export-panel__meta">
          Edge prep included: {config.edgePrep} / {config.edgePrepSide} / {config.bevelAngle} deg / root face {config.rootFace} mm.
        </div>
      ) : null}
    </section>
  );
}
