import { useId } from 'react';
import type { BlankCalculationResult, CalculationResult, CalculatorConfig } from '../types';
import { Icon } from './Icon';
import { SvgDimension } from './SvgDimension';

interface BlankModulePanelProps {
  config: CalculatorConfig;
  calculated: CalculationResult;
  blank: BlankCalculationResult;
}

const formatMm = (value: number) => `${value.toFixed(1)} mm`;
const formatKg = (value: number) => `${value.toFixed(1)} kg`;

export function CuttingMap({ blank, print = false }: { blank: BlankCalculationResult; print?: boolean }) {
  const maskId = useId().replace(/:/g, '');
  const sheetSide = blank.recommendedSquareSheetSide;
  const discRadius = blank.requiredDiscDiameter / 2;
  const center = sheetSide / 2;
  const strokeWidth = Math.max(1, sheetSide / 500);
  const fontSize = Math.max(18, sheetSide / 42);
  const viewBox = `0 0 ${sheetSide} ${sheetSide}`;
  const color = print ? 'black' : '#cbd5e1';

  return (
    <svg viewBox={viewBox} className={print ? 'blank-report-map__svg' : 'blank-map__svg'}>
      <defs>
        <mask id={maskId}>
          <rect x="0" y="0" width={sheetSide} height={sheetSide} fill="white" />
          <circle cx={center} cy={center} r={discRadius} fill="black" />
        </mask>
      </defs>
      <rect x="0" y="0" width={sheetSide} height={sheetSide} fill={print ? '#f9fafb' : 'rgba(15, 23, 42, 0.8)'} stroke={color} strokeWidth={strokeWidth} />
      <rect x="0" y="0" width={sheetSide} height={sheetSide} fill={print ? '#e5e7eb' : 'rgba(249, 115, 22, 0.18)'} mask={`url(#${maskId})`} />
      <circle cx={center} cy={center} r={discRadius} fill={print ? 'white' : 'rgba(56, 189, 248, 0.12)'} stroke={print ? 'black' : '#38bdf8'} strokeWidth={strokeWidth * 1.6} />
      <line x1={center} y1="0" x2={center} y2={sheetSide} stroke={color} strokeWidth={strokeWidth} strokeDasharray={`${fontSize / 2},${fontSize / 3}`} opacity="0.7" />
      <line x1="0" y1={center} x2={sheetSide} y2={center} stroke={color} strokeWidth={strokeWidth} strokeDasharray={`${fontSize / 2},${fontSize / 3}`} opacity="0.7" />
      <SvgDimension
        x1={0}
        y1={sheetSide}
        x2={sheetSide}
        y2={sheetSide}
        text={`Sheet ${blank.recommendedSquareSheetSide.toFixed(0)}`}
        offset={-fontSize * 1.4}
        fontSize={fontSize}
        orientation="horizontal"
        color={color}
      />
      <SvgDimension
        x1={center - discRadius}
        y1={center}
        x2={center + discRadius}
        y2={center}
        text={`Disc ${blank.requiredDiscDiameter.toFixed(0)}`}
        offset={fontSize * 1.4}
        fontSize={fontSize}
        orientation="horizontal"
        color={color}
      />
    </svg>
  );
}

export function ThicknessMap({ blank, print = false }: { blank: BlankCalculationResult; print?: boolean }) {
  const width = 900;
  const height = 190;
  const baseline = 118;
  const centerX = width / 2;
  const radius = 370;
  const color = print ? '#111827' : '#cbd5e1';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={print ? 'blank-report-map__svg' : 'blank-map__svg'}>
      <line x1={centerX - radius} y1={baseline} x2={centerX + radius} y2={baseline} stroke={color} strokeDasharray="8,6" opacity="0.45" />
      {blank.thicknessZones.map((zone) => {
        const x1 = centerX + radius * zone.radialStartRatio;
        const x2 = centerX + radius * zone.radialEndRatio;
        const leftX1 = centerX - radius * zone.radialEndRatio;
        const leftX2 = centerX - radius * zone.radialStartRatio;
        const zoneHeight = 28 + zone.reductionPercent * 2.2;
        const y = baseline - zoneHeight;

        return (
          <g key={zone.id}>
            <rect x={x1} y={y} width={x2 - x1} height={zoneHeight} fill={zone.color} opacity={print ? 0.78 : 0.9} />
            <rect x={leftX1} y={y} width={leftX2 - leftX1} height={zoneHeight} fill={zone.color} opacity={print ? 0.78 : 0.9} />
          </g>
        );
      })}
      <path d={`M ${centerX - radius} ${baseline} C ${centerX - 280} 20 ${centerX + 280} 20 ${centerX + radius} ${baseline}`} fill="none" stroke={color} strokeWidth="4" />
      <line x1={centerX} y1="18" x2={centerX} y2={baseline + 38} stroke={color} strokeDasharray="8,6" opacity="0.5" />
      <text x={centerX} y={baseline + 62} textAnchor="middle" fill={color} fontSize="22" fontWeight="700">
        Estimated thinning zones
      </text>
      {blank.thicknessZones.map((zone, index) => (
        <g key={zone.id} transform={`translate(${28 + index * 214} 154)`}>
          <rect x="0" y="-17" width="22" height="22" rx="4" fill={zone.color} />
          <text x="32" y="0" fill={color} fontSize="18" fontWeight="700">
            {zone.label}
          </text>
          <text x="32" y="23" fill={color} fontSize="15" opacity="0.82">
            -{zone.reductionPercent}% / {zone.finalThickness.toFixed(2)} mm
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BlankModulePanel({ config, calculated, blank }: BlankModulePanelProps) {
  return (
    <section className="blank-module card">
      <div className="section-title section-title--between">
        <span className="section-title__group">
          <Icon name="scissors" size={18} />
          <span>Blank & Thickness Map</span>
        </span>
        <span className="blank-module__badge">Engineering v1 estimate</span>
      </div>

      <div className="metrics-bar metrics-bar--blank">
        <div>
          <span className="metric-label">Required disc</span>
          <strong>{formatMm(blank.requiredDiscDiameter)}</strong>
        </div>
        <div>
          <span className="metric-label">Min square sheet</span>
          <strong>
            {blank.minimumSquareSheetSide.toFixed(0)} x {blank.minimumSquareSheetSide.toFixed(0)} mm
          </strong>
        </div>
        <div>
          <span className="metric-label">Recommended sheet</span>
          <strong>
            {blank.recommendedSquareSheetSide.toFixed(0)} x {blank.recommendedSquareSheetSide.toFixed(0)} mm
          </strong>
        </div>
        <div>
          <span className="metric-label">Estimated min s</span>
          <strong>{blank.estimatedMinimumThickness.toFixed(2)} mm</strong>
        </div>
      </div>

      <div className="blank-layout">
        <div className="blank-map">
          <div className="blank-map__header">
            <h3>Cutting Map</h3>
            <span>{blank.wastePercent.toFixed(1)}% square-sheet waste</span>
          </div>
          <CuttingMap blank={blank} />
        </div>

        <div className="blank-map">
          <div className="blank-map__header">
            <h3>Thickness Map</h3>
            <span>Minimum at {blank.minThicknessZone.label}</span>
          </div>
          <ThicknessMap blank={blank} />
        </div>
      </div>

      <dl className="blank-detail-grid">
        <div>
          <dt>Base blank diameter</dt>
          <dd>{formatMm(blank.baseBlankDiameter)}</dd>
        </div>
        <div>
          <dt>Blank disc weight</dt>
          <dd>{formatKg(blank.blankWeight)}</dd>
        </div>
        <div>
          <dt>Recommended sheet weight</dt>
          <dd>{formatKg(blank.recommendedSquareSheetWeight)}</dd>
        </div>
        <div>
          <dt>Suggested starting thickness for final nominal</dt>
          <dd>{blank.suggestedStartingThicknessForFinalNominal.toFixed(1)} mm</dd>
        </div>
        <div>
          <dt>Head standard</dt>
          <dd>{config.standard}</dd>
        </div>
        <div>
          <dt>QC minimum thickness</dt>
          <dd>{(config.thickness - calculated.tolerances.thicknessMin).toFixed(2)} mm</dd>
        </div>
      </dl>

      {blank.warnings.length > 0 ? (
        <ul className="blank-warnings">
          {blank.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
