import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import EtaIndicator from '../components/EtaIndicator';
import { getShipment, triggerTracking, getTrackingLog, getEtaHistory } from '../services/api';

interface Shipment {
  id: string;
  mbl: string;
  carrier: string;
  shipment_status: string;
  current_eta: string | null;
  original_eta: string | null;
  eta_changed: boolean;
  is_active: boolean;
  last_check_date: string | null;
  check_status: string | null;
  check_count: number;
  created_at: string;
}

interface LogEntry {
  id: string;
  status: string;
  checked_at: string;
  duration_ms: number | null;
  error_message: string | null;
}

interface EtaEntry {
  id: string;
  previous_eta: string | null;
  new_eta: string | null;
  changed_at: string;
}

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [etaHistory, setEtaHistory] = useState<EtaEntry[]>([]);
  const [tab, setTab] = useState<'log' | 'eta'>('log');
  const [tracking, setTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!id) return;
    try {
      const [s, l, e] = await Promise.all([
        getShipment(id),
        getTrackingLog(id),
        getEtaHistory(id),
      ]);
      setShipment(s);
      setLogs(l);
      setEtaHistory(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleTrack = async () => {
    if (!id) return;
    setTracking(true);
    setTrackingResult(null);
    try {
      const res = await triggerTracking(id);
      setTrackingResult(res.success ? 'Tracking check completed.' : 'Tracking check failed.');
      fetchAll();
    } catch {
      setTrackingResult('Tracking request failed.');
    } finally {
      setTracking(false);
    }
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const fmtDateTime = (d: string | null) =>
    d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!shipment) {
    return <div className="text-center text-slate-400 py-12">Shipment not found.</div>;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/shipments')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Back to Shipments
      </button>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-mono">{shipment.mbl}</h2>
            <p className="text-slate-500 mt-1">{shipment.carrier}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={shipment.shipment_status} />
            {shipment.is_active && (
              <button
                onClick={handleTrack}
                disabled={tracking}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${tracking ? 'animate-spin' : ''}`} />
                {tracking ? 'Checking...' : 'Run Tracking'}
              </button>
            )}
          </div>
        </div>

        {trackingResult && (
          <div className="mt-3 text-sm text-blue-600 bg-blue-50 rounded-lg p-3">{trackingResult}</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs text-slate-400 uppercase">Current ETA</p>
            <div className="mt-1"><EtaIndicator eta={shipment.current_eta} etaChanged={shipment.eta_changed} /></div>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Original ETA</p>
            <p className="mt-1 text-sm text-slate-700">{fmtDate(shipment.original_eta)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Last Check</p>
            <p className="mt-1 text-sm text-slate-700">{fmtDateTime(shipment.last_check_date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Created</p>
            <p className="mt-1 text-sm text-slate-700">{fmtDate(shipment.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-slate-200">
          <button
            onClick={() => setTab('log')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'log' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Tracking Log ({logs.length})
          </button>
          <button
            onClick={() => setTab('eta')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === 'eta' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ETA History ({etaHistory.length})
          </button>
        </div>

        <div className="mt-4">
          {tab === 'log' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              {logs.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No tracking logs yet.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Date', 'Status', 'Duration', 'Error'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-3 text-sm text-slate-700">{fmtDateTime(l.checked_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${l.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{l.duration_ms != null ? `${l.duration_ms}ms` : '-'}</td>
                        <td className="px-4 py-3 text-sm text-red-500 max-w-xs truncate">{l.error_message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'eta' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              {etaHistory.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No ETA changes recorded.</p>
              ) : (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Date', 'Previous ETA', 'New ETA'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {etaHistory.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3 text-sm text-slate-700">{fmtDateTime(e.changed_at)}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{fmtDate(e.previous_eta)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-amber-600">{fmtDate(e.new_eta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
