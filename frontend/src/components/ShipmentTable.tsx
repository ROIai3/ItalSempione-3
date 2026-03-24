import StatusBadge from './StatusBadge';
import EtaIndicator from './EtaIndicator';
import { Trash2, RefreshCw } from 'lucide-react';

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
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (ids: string[], isChecked: boolean) => void;
  onRowClick?: (id: string) => void;
  onDeleteSingle?: (id: string) => void;
  onTrackSingle?: (id: string) => void;
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

export default function ShipmentTable({ 
  shipments, 
  selectedIds = [], 
  onToggleSelect, 
  onSelectAll, 
  onRowClick, 
  onDeleteSingle, 
  onTrackSingle, 
  loading 
}: Props) {
  const isAllSelected = shipments.length > 0 && shipments.every(s => selectedIds.includes(s.id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectAll) {
      onSelectAll(shipments.map(s => s.id), e.target.checked);
    }
  };
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" className="rounded border-slate-300" disabled />
              </th>
              {['MBL', 'Carrier', 'Status', 'ETA', 'Last Check', 'Check', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
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
            <th className="px-4 py-3 w-10 text-left">
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="rounded border-slate-300 w-4 h-4 cursor-pointer" 
              />
            </th>
            {['MBL', 'Carrier', 'Status', 'ETA', 'Last Check', 'Check', 'Actions'].map((h) => (
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
              className={`${onRowClick ? 'hover:bg-blue-50' : ''} ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
            >
              <td className="px-4 py-3">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(s.id)}
                  onChange={() => onToggleSelect?.(s.id)}
                  className="rounded border-slate-300 w-4 h-4 cursor-pointer" 
                />
              </td>
              <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900 cursor-pointer" onClick={() => onRowClick?.(s.id)}>{s.mbl}</td>
              <td className="px-4 py-3 text-sm text-slate-600 cursor-pointer" onClick={() => onRowClick?.(s.id)}>{s.carrier}</td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => onRowClick?.(s.id)}><StatusBadge status={s.shipment_status} /></td>
              <td className="px-4 py-3 cursor-pointer" onClick={() => onRowClick?.(s.id)}><EtaIndicator eta={s.current_eta} etaChanged={s.eta_changed} /></td>
              <td className="px-4 py-3 text-sm text-slate-500 cursor-pointer" onClick={() => onRowClick?.(s.id)}>{formatDate(s.last_check_date)}</td>
              <td className="px-4 py-3 text-sm cursor-pointer" onClick={() => onRowClick?.(s.id)}>
                <span className={checkStatusStyle[s.check_status || 'pending'] || 'text-slate-400'}>
                  {s.check_status || '-'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm flex gap-2">
                <button
                  type="button"
                  title="Check Tracking Now"
                  onClick={() => onTrackSingle?.(s.id)}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                >
                  <RefreshCw size={18} />
                </button>
                <button
                  type="button"
                  title="Delete Shipment"
                  onClick={() => onDeleteSingle?.(s.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
