import StatusBadge from './StatusBadge';
import EtaIndicator from './EtaIndicator';

interface Shipment {
  id: string;
  mbl: string;
  carrier: string;
  shipment_status: string;
  current_eta: string | null;
  eta_changed: boolean;
  last_check_date: string | null;
  check_status: string | null;
}

interface Props {
  shipments: Shipment[];
  onRowClick?: (id: string) => void;
  loading?: boolean;
}

function formatDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const checkStatusStyle: Record<string, string> = {
  success: 'text-green-600',
  failed: 'text-red-600',
  pending: 'text-slate-400',
};

export default function ShipmentTable({ shipments, onRowClick, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['MBL', 'Carrier', 'Status', 'ETA', 'Last Check', 'Check'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
        No shipments found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {['MBL', 'Carrier', 'Status', 'ETA', 'Last Check', 'Check'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {shipments.map((s, i) => (
            <tr
              key={s.id}
              onClick={() => onRowClick?.(s.id)}
              className={`${onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''} ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
            >
              <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900">{s.mbl}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{s.carrier}</td>
              <td className="px-4 py-3"><StatusBadge status={s.shipment_status} /></td>
              <td className="px-4 py-3"><EtaIndicator eta={s.current_eta} etaChanged={s.eta_changed} /></td>
              <td className="px-4 py-3 text-sm text-slate-500">{formatDate(s.last_check_date)}</td>
              <td className="px-4 py-3 text-sm">
                <span className={checkStatusStyle[s.check_status || 'pending'] || 'text-slate-400'}>
                  {s.check_status || '-'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
