import { getDrawingMetrics, getHeadPath, getNozzleDrawing } from '../lib/drawing';
import type { CalculationResult, CalculatorConfig, ParsedNozzle } from '../types';
import { SvgDimension } from './SvgDimension';

interface PreviewPanelProps {
  config: CalculatorConfig;
  calculated: CalculationResult;
  nozzles: ParsedNozzle[];
  volumeM3: number;
}

export function PreviewPanel({ config, calculated, nozzles, volumeM3 }: PreviewPanelProps) {
  const metrics = getDrawingMetrics(config, calculated);
  const { center, screenViewBoxSize, printFontSize } = metrics;
  const width = config.diameterOuter;
  const height = calculated.totalHeight;
  const straightFlange = config.straightFlange;
  const thickness = config.thickness;
  const path = getHeadPath(config, calculated, center);

  return (
    <section className="preview-shell card">
      <div className="preview-shell__canvas">
        <svg viewBox={`0 0 ${screenViewBoxSize} ${screenViewBoxSize}`} className="preview-svg">
          <defs>
            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
          </defs>
          <line x1={center} y1="0" x2={center} y2={screenViewBoxSize} stroke="rgba(255,255,255,0.14)" strokeDasharray="10,10" />
          <line x1="0" y1={center} x2={screenViewBoxSize} y2={center} stroke="rgba(255,255,255,0.14)" strokeDasharray="10,10" />

          <path d={path} fill="url(#metalGradient)" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" />

          <g className="dimensions">
            <line
              x1={center}
              y1={center - height / 2 - printFontSize}
              x2={center}
              y2={center + height / 2 + printFontSize}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray={`${printFontSize},${printFontSize / 2}`}
              opacity="0.5"
            />

            <SvgDimension
              x1={center - width / 2}
              y1={center + height / 2}
              x2={center + width / 2}
              y2={center + height / 2}
              text={`Da = ${config.diameterOuter}`}
              offset={printFontSize * 2.5}
              fontSize={printFontSize}
              orientation="horizontal"
              color="#cbd5e1"
            />

            <SvgDimension
              x1={center + width / 2}
              y1={center - height / 2 + thickness}
              x2={center + width / 2}
              y2={center + height / 2}
              text={`H = ${calculated.totalHeight.toFixed(1)}`}
              offset={printFontSize * 3}
              fontSize={printFontSize}
              orientation="vertical"
              color="#cbd5e1"
            />

            <SvgDimension
              x1={center - width / 2}
              y1={center + height / 2 - straightFlange}
              x2={center - width / 2}
              y2={center + height / 2}
              text={`h1 = ${config.straightFlange}`}
              offset={-printFontSize * 2.5}
              fontSize={printFontSize}
              orientation="vertical"
              color="#cbd5e1"
            />

            <g>
              <line
                x1={center + width / 2 - thickness / 2}
                y1={center + height / 2 - straightFlange / 2}
                x2={center + width / 2 + printFontSize * 4}
                y2={center + height / 2 - straightFlange / 2}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              <text
                x={center + width / 2 + printFontSize * 4.5}
                y={center + height / 2 - straightFlange / 2 + printFontSize * 0.35}
                fontSize={printFontSize}
                fontWeight="bold"
                fill="#cbd5e1"
              >
                s = {config.thickness}
              </text>
              <circle cx={center + width / 2 - thickness / 2} cy={center + height / 2 - straightFlange / 2} r={printFontSize / 5} fill="#cbd5e1" />
            </g>

            {config.edgePrep !== 'None' ? (
              <g>
                <line
                  x1={center + width / 2}
                  y1={center + height / 2}
                  x2={center + width / 2 + printFontSize * 2}
                  y2={center + height / 2 + printFontSize * 2}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={center + width / 2 + printFontSize * 2.2}
                  y={center + height / 2 + printFontSize * 2.2}
                  fontSize={printFontSize * 0.8}
                  fontWeight="bold"
                  fill="#cbd5e1"
                >
                  {config.edgePrep} {config.edgePrepSide}: {config.bevelAngle} deg
                </text>
              </g>
            ) : null}
          </g>

          {nozzles.map((nozzle, index) => {
            const drawing = getNozzleDrawing(nozzle, index, config, calculated, center);

            return (
              <g key={drawing.id}>
                <rect
                  x={drawing.x - drawing.width / 2}
                  y={drawing.y - drawing.height}
                  width={drawing.width}
                  height={drawing.height}
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="1"
                />
                <text x={drawing.x} y={drawing.y - drawing.height - 10} textAnchor="middle" fill="#ef4444" fontSize="20" fontWeight="bold">
                  {drawing.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="metrics-bar">
        <div>
          <span className="metric-label">Approx. volume</span>
          <strong>{volumeM3.toFixed(3)} m3</strong>
        </div>
        <div>
          <span className="metric-label">Weight</span>
          <strong>{calculated.weight.toFixed(1)} kg</strong>
        </div>
        <div>
          <span className="metric-label">Blank dia</span>
          <strong>{calculated.blankDiameter.toFixed(1)} mm</strong>
        </div>
        <div>
          <span className="metric-label">Dish depth h2</span>
          <strong>{calculated.h2.toFixed(1)} mm</strong>
        </div>
      </div>
    </section>
  );
}
