import { APP_VERSION } from '../constants';
import { getDrawingMetrics, getHeadPath, getNozzleDrawing } from '../lib/drawing';
import type { CalculationResult, CalculatorConfig, ParsedNozzle } from '../types';
import { Icon } from './Icon';
import { SvgDimension } from './SvgDimension';

interface ReportViewProps {
  config: CalculatorConfig;
  calculated: CalculationResult;
  nozzles: ParsedNozzle[];
  isOpen: boolean;
  onClose: () => void;
}

export function ReportView({ config, calculated, nozzles, isOpen, onClose }: ReportViewProps) {
  const metrics = getDrawingMetrics(config, calculated);
  const { center, printMinX, printMinY, printWidth, printHeight, printViewBox, printFontSize } = metrics;
  const width = config.diameterOuter;
  const height = calculated.totalHeight;
  const straightFlange = config.straightFlange;
  const thickness = config.thickness;
  const path = getHeadPath(config, calculated, center);

  return (
    <div className={`report-overlay ${isOpen ? 'report-overlay--open' : ''}`}>
      <div className="report-toolbar print-hidden">
        <div className="report-toolbar__note">
          <Icon name="info" size={18} className="text-blue" />
          <span>Press Ctrl+P or use the print button to export the report.</span>
        </div>
        <div className="report-toolbar__actions">
          <button type="button" className="button button--primary" onClick={() => window.print()}>
            <Icon name="printer" size={16} />
            Print
          </button>
          <button type="button" className="button button--ghost" onClick={onClose}>
            <Icon name="x" size={16} />
            Close
          </button>
        </div>
      </div>

      <div className="report-sheet">
        <div className="report-header">
          <div>
            <h1>Manufacturing Report</h1>
            <h2>Dished Head Specification and QC</h2>
          </div>
          <div className="report-meta">
            <div>Job No: ________________</div>
            <div>Date: {new Date().toLocaleDateString()}</div>
            <div className="report-version">v{APP_VERSION}</div>
          </div>
        </div>

        <div className="report-grid">
          <section>
            <h3>Design Data</h3>
            <table>
              <tbody>
                <tr>
                  <td>Standard</td>
                  <td>{config.standard}</td>
                </tr>
                <tr>
                  <td>Material</td>
                  <td>{config.material}</td>
                </tr>
                <tr>
                  <td>Edge prep</td>
                  <td>{config.edgePrep === 'None' ? 'Square Cut' : `${config.edgePrep} / ${config.edgePrepSide} / ${config.bevelAngle} deg`}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>Dimensions</h3>
            <table>
              <tbody>
                <tr>
                  <td>Da (Outer Dia)</td>
                  <td>{config.diameterOuter} mm</td>
                </tr>
                <tr>
                  <td>s (Thickness)</td>
                  <td>{config.thickness} mm</td>
                </tr>
                <tr>
                  <td>H (Total Height)</td>
                  <td>{calculated.totalHeight.toFixed(1)} mm</td>
                </tr>
                <tr>
                  <td>Blank Diameter</td>
                  <td>{calculated.blankDiameter.toFixed(1)} mm</td>
                </tr>
                <tr>
                  <td>Est. Weight</td>
                  <td>{calculated.weight.toFixed(1)} kg</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <div className="report-preview">
          <svg viewBox={printViewBox} className="report-preview__svg">
            <line x1={center} y1={printMinY} x2={center} y2={printMinY + printHeight} stroke="#cccccc" strokeDasharray="5,5" />
            <line x1={printMinX} y1={center} x2={printMinX + printWidth} y2={center} stroke="#cccccc" strokeDasharray="5,5" />
            <path d={path} fill="none" stroke="black" strokeWidth={Math.max(2, config.diameterOuter / 400)} strokeLinejoin="round" />

            <line
              x1={center}
              y1={center - height / 2 - printFontSize}
              x2={center}
              y2={center + height / 2 + printFontSize}
              stroke="black"
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
              color="black"
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
              color="black"
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
              color="black"
            />

            {nozzles.map((nozzle, index) => {
              const drawing = getNozzleDrawing(nozzle, index, config, calculated, center);

              return (
                <rect
                  key={drawing.id}
                  x={drawing.x - drawing.width / 2}
                  y={drawing.y - drawing.height}
                  width={drawing.width}
                  height={drawing.height}
                  fill="none"
                  stroke="black"
                  strokeWidth={Math.max(1, config.diameterOuter / 1000)}
                />
              );
            })}
          </svg>
        </div>

        <section className="report-qc">
          <h3>Quality Control / Measurement Report</h3>
          <p>Tolerances based on DIN 28005-1 (Formed Heads). All dimensions in mm.</p>

          <table className="qc-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Nominal</th>
                <th>Tolerance</th>
                <th>Actual 1</th>
                <th>Actual 2</th>
                <th>Result / Dev</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Outer Diameter (Da)</td>
                <td>{config.diameterOuter}</td>
                <td>
                  +{calculated.tolerances.daPlus} / -{calculated.tolerances.daMinus}
                </td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Ovality</td>
                <td>0</td>
                <td>Max {calculated.tolerances.ovality}</td>
                <td colSpan={2} className="muted-cell">
                  Calculated
                </td>
                <td></td>
              </tr>
              <tr>
                <td>Total Height (H)</td>
                <td>{calculated.totalHeight.toFixed(1)}</td>
                <td>
                  +{calculated.tolerances.hPlus} / -{calculated.tolerances.hMinus}
                </td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Wall Thickness (s)</td>
                <td>{config.thickness}</td>
                <td>Min {(config.thickness - calculated.tolerances.thicknessMin).toFixed(1)}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Edge Preparation</td>
                <td>-</td>
                <td>Visual</td>
                <td colSpan={2} className="muted-cell">
                  Pass / Fail
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="report-signatures">
          <div>
            <div className="signature-line"></div>
            <span>QC Inspector (Name & Sign)</span>
          </div>
          <div>
            <div className="signature-line"></div>
            <span>Date</span>
          </div>
        </div>
      </div>
    </div>
  );
}
