import { useEnergy, useEnergySnapshot } from '../../hooks/useEnergy';
import { EnergyGauge } from '../charts/EnergyGauge';
import { EnergyTimeline } from '../charts/EnergyTimeline';
import { SourceBanner } from '../common/SourceBanner';
import { SkeletonCard } from '../common/SkeletonCard';
import { LiveBadge } from '../common/LiveBadge';

export function EnergyPanel() {
  const { data: timeline, loading: tLoading, error: tError } = useEnergy();
  const { data: snapshot, loading: sLoading } = useEnergySnapshot();
  const datenstand = timeline?.[0]?.dataDate ?? '…';

  return (
    <div className="card bg-base-100 shadow-xs border border-base-200" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>⚡ Stromnetz Deutschland</span>
            <LiveBadge />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Nationale Erzeugung · alle 15 Minuten</div>
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {tError && (
          <div style={{
            background: '#FEF3C7', borderLeft: '4px solid #F59E0B',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400E', marginBottom: 16,
          }}>
            ⚠ Daten werden geladen… {tError}
          </div>
        )}

        {sLoading
          ? <SkeletonCard height={160} />
          : snapshot
            ? <EnergyGauge snapshot={snapshot} />
            : <SkeletonCard height={160} />
        }

        {tLoading
          ? <SkeletonCard height={180} />
          : timeline
            ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B6B6B', marginBottom: 8 }}>
                  Letzte 24 Stunden
                </div>
                <EnergyTimeline data={timeline} />
              </div>
            )
            : <SkeletonCard height={180} />
        }

        <div style={{ marginTop: 16 }}>
          <SourceBanner
            source="Bundesnetzagentur | SMARD.de"
            datenstand={datenstand}
            frequency="alle 15 min"
            isLive
          />
        </div>
      </div>
    </div>
  );
}
