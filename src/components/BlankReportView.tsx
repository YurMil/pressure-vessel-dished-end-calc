import { APP_VERSION } from '../constants';
import type { BlankCalculationResult, BlankOptions, CalculationResult, CalculatorConfig, ParsedNozzle } from '../types';
import { CuttingMap, ThicknessMap } from './BlankModulePanel';
import { Icon } from './Icon';

interface BlankReportViewProps {
  config: CalculatorConfig;
  calculated: CalculationResult;
  blankOptions: BlankOptions;
  blank: BlankCalculationResult;
  nozzles: ParsedNozzle[];
  isOpen: boolean;
  onClose: () => void;
}

const formatMm = (value: number) => value.toFixed(1);
const formatKg = (value: number) => value.toFixed(1);
const formatAreaM2 = (valueMm2: number) => (valueMm2 / 1_000_000).toFixed(3);

export function BlankReportView({ config, calculated, blankOptions, blank, nozzles, isOpen, onClose }: BlankReportViewProps) {
  return (
    <div className={`report-overlay ${isOpen ? 'report-overlay--open' : ''}`}>
      <div className="report-toolbar print-hidden">
        <div className="report-toolbar__note">
          <Icon name="info" size={18} className="text-blue" />
          <span>Press Ctrl+P or use the print button to export the blank report.</span>
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

      <div className="report-sheet blank-report-sheet">
        <div className="report-header">
          <div>
            <h1>Blank Report</h1>
            <h2>Cutting Layout and Estimated Thickness Map</h2>
          </div>
          <div className="report-meta">
            <div>Job No: ________________</div>
            <div>Date: {new Date().toLocaleDateString()}</div>
            <div className="report-version">v{APP_VERSION}</div>
          </div>
        </div>

        <div className="report-grid">
          <section>
            <h3>Configured Head</h3>
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
                  <td>Outer Diameter Da</td>
                  <td>{formatMm(config.diameterOuter)} mm</td>
                </tr>
                <tr>
                  <td>Nominal Sheet Thickness s</td>
                  <td>{formatMm(config.thickness)} mm</td>
                </tr>
                <tr>
                  <td>Straight Flange h1</td>
                  <td>{formatMm(config.straightFlange)} mm</td>
                </tr>
                <tr>
                  <td>Nozzle Cutouts</td>
                  <td>{nozzles.length === 0 ? 'None in blank sizing v1' : `${nozzles.length} excluded from blank sizing v1`}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3>Blank Assumptions</h3>
            <table>
              <tbody>
                <tr>
                  <td>Base Blank Diameter</td>
                  <td>{formatMm(blank.baseBlankDiameter)} mm</td>
                </tr>
                <tr>
                  <td>Radial Trim Allowance</td>
                  <td>{formatMm(blankOptions.trimAllowanceRadial)} mm</td>
                </tr>
                <tr>
                  <td>Cutting Clearance per Side</td>
                  <td>{formatMm(blankOptions.cuttingClearance)} mm</td>
                </tr>
                <tr>
                  <td>Rounding Step</td>
                  <td>{formatMm(blankOptions.roundingStep)} mm</td>
                </tr>
                <tr>
                  <td>Dish Depth h2</td>
                  <td>{formatMm(calculated.h2)} mm</td>
                </tr>
                <tr>
                  <td>Total Height H</td>
                  <td>{formatMm(calculated.totalHeight)} mm</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <section className="report-qc">
          <h3>Blank Sizing</h3>
          <table className="qc-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Size / Value</th>
                <th>Area</th>
                <th>Estimated Weight</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Required Circular Blank</td>
                <td>Dia {formatMm(blank.requiredDiscDiameter)} mm</td>
                <td>{formatAreaM2(blank.blankDiscAreaMm2)} m2</td>
                <td>{formatKg(blank.blankWeight)} kg</td>
              </tr>
              <tr>
                <td>Minimum Square Sheet</td>
                <td>
                  {formatMm(blank.minimumSquareSheetSide)} x {formatMm(blank.minimumSquareSheetSide)} mm
                </td>
                <td>{formatAreaM2(blank.minimumSquareSheetSide ** 2)} m2</td>
                <td className="muted-cell">Cutting reference</td>
              </tr>
              <tr>
                <td>Recommended Square Sheet</td>
                <td>
                  {formatMm(blank.recommendedSquareSheetSide)} x {formatMm(blank.recommendedSquareSheetSide)} mm
                </td>
                <td>{formatAreaM2(blank.recommendedSquareSheetAreaMm2)} m2</td>
                <td>{formatKg(blank.recommendedSquareSheetWeight)} kg</td>
              </tr>
              <tr>
                <td>Estimated Square-Sheet Waste</td>
                <td>{blank.wastePercent.toFixed(1)}%</td>
                <td>{formatAreaM2(blank.wasteAreaMm2)} m2</td>
                <td className="muted-cell">Before offcut reuse</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="blank-report-maps">
          <section>
            <h3>Cutting Map</h3>
            <div className="blank-report-map">
              <CuttingMap blank={blank} print />
            </div>
          </section>
          <section>
            <h3>Estimated Thickness Map</h3>
            <div className="blank-report-map">
              <ThicknessMap blank={blank} print />
            </div>
          </section>
        </div>

        <section className="report-qc">
          <h3>Thickness Zone Estimate</h3>
          <table className="qc-table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Reduction</th>
                <th>Estimated Final Thickness</th>
                <th>QC Minimum</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {blank.thicknessZones.map((zone) => (
                <tr key={zone.id}>
                  <td>{zone.label}</td>
                  <td>-{zone.reductionPercent}%</td>
                  <td>{zone.finalThickness.toFixed(2)} mm</td>
                  <td>{blank.qcMinimumThickness.toFixed(2)} mm</td>
                  <td>{zone.finalThickness >= blank.qcMinimumThickness ? 'Above QC minimum' : 'Below QC minimum'}</td>
                </tr>
              ))}
              <tr>
                <td>Advisory Starting Thickness</td>
                <td colSpan={4}>Use approximately {blank.suggestedStartingThicknessForFinalNominal.toFixed(1)} mm to target final nominal thickness after maximum estimated thinning.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="blank-report-notes">
          <h3>Warnings and Assumptions</h3>
          <ul>
            {blank.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            <li>Nozzle cutouts are excluded from blank size and waste calculations in this v1 module.</li>
            <li>This report is not a pressure-vessel code verification or finite-element forming simulation.</li>
          </ul>
        </section>

        <div className="report-signatures">
          <div>
            <div className="signature-line"></div>
            <span>Prepared By (Name & Sign)</span>
          </div>
          <div>
            <div className="signature-line"></div>
            <span>Manufacturing Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
