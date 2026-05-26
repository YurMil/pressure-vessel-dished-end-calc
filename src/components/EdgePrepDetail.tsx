import type { CalculatorConfig } from '../types';
import { EdgePrepPreview } from './EdgePrepPreview';
import { Icon } from './Icon';

interface EdgePrepDetailProps {
  config: CalculatorConfig;
  isVisible: boolean;
  onClose: () => void;
}

export function EdgePrepDetail({ config, isVisible, onClose }: EdgePrepDetailProps) {
  const isBevel = config.edgePrep === 'V-Bevel';

  return (
    <div className={`edge-prep-detail ${isVisible ? 'edge-prep-detail--open' : ''}`}>
      <div className="edge-prep-detail__inner">
        <div className="edge-prep-detail__header">
          <div className="section-title">
            <Icon name="scissors" size={20} />
            <div>
              <h2>Weld Edge Prep Detail</h2>
              <p>Enlarged view of edge machining parameters.</p>
            </div>
          </div>
          <button type="button" className="button button--secondary" onClick={onClose}>
            <Icon name="x" size={16} />
            Close
          </button>
        </div>

        <div className="edge-prep-detail__grid">
          <div className="edge-prep-detail__drawing">
            <EdgePrepPreview
              edgePrep={config.edgePrep}
              edgePrepSide={config.edgePrepSide}
              thickness={config.thickness}
              rootFace={config.rootFace}
              bevelAngle={config.bevelAngle}
              orientation="head"
              variant="detail"
            />
          </div>

          <section className="card edge-prep-detail__data">
            <div>
              <span className="metric-label">Weld Prep</span>
              <h3>{config.edgePrep === 'None' ? 'Square Cut' : 'V-Bevel'}</h3>
            </div>
            <dl className="derived-grid">
              <div>
                <dt>Standard</dt>
                <dd>{config.standard}</dd>
              </div>
              <div>
                <dt>Thickness</dt>
                <dd>{config.thickness} mm</dd>
              </div>
              <div>
                <dt>Sides</dt>
                <dd>{config.edgePrepSide === 'double' ? 'Double side' : 'Single side'}</dd>
              </div>
              {isBevel ? (
                <>
                  <div>
                    <dt>Root Face c</dt>
                    <dd>{config.rootFace} mm</dd>
                  </div>
                  <div>
                    <dt>Bevel Angle u</dt>
                    <dd>{config.bevelAngle} deg</dd>
                  </div>
                </>
              ) : (
                <div>
                  <dt>Edge</dt>
                  <dd>Square cut</dd>
                </div>
              )}
            </dl>
            <p className="edge-prep-detail__note">
              Keep root face and bevel angle within shop tolerances. The STEP model uses these same parameters when edge prep is enabled.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
