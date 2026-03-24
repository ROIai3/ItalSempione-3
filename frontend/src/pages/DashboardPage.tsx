import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Navigation, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import ShipmentTable from '../components/ShipmentTable';
import { getDashboardStats, getShipments, resetSystem } from '../services/api';

interface Stats {
  total: number;
  active: number;
  arrived: number;
  failedChecks: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, arrived: 0, failedChecks: 0 });
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getShipments({ limit: 10 }),
    ])
      .then(([s, sh]) => {
        setStats(s);
        setShipments(sh.data?.shipments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleReset = async () => {
    if (resetInput !== 'RESET') return;
    setResetting(true);
    try {
      await resetSystem();
      setStats({ total: 0, active: 0, arrived: 0, failedChecks: 0 });
      setShipments([]);
      setShowResetModal(false);
      setResetInput('');
    } catch (err) {
      alert('Error during reset');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Shipments" value={stats.total} icon={Ship} color="slate" />
        <StatsCard title="Active" value={stats.active} icon={Navigation} color="blue" />
        <StatsCard title="Arrived" value={stats.arrived} icon={CheckCircle} color="green" />
        <StatsCard title="Failed Checks" value={stats.failedChecks} icon={AlertTriangle} color="red" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Recent Shipments</h2>
          <button
            onClick={() => navigate('/shipments')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>
        <ShipmentTable
          shipments={shipments}
          onRowClick={(id) => navigate(`/shipments/${id}`)}
          loading={loading}
        />
      </div>

      {/* Danger Zone */}
      <div className="mt-8 pt-6 border-t border-red-100">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-red-800 font-semibold text-lg flex items-center gap-2">
                <AlertOctagon size={20} />
                Danger Zone
              </h3>
              <p className="text-red-600 text-sm mt-1">
                Completely reset the tracking system. This will permanently delete all shipments, batches, and tracking history.
              </p>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition cursor-pointer whitespace-nowrap"
            >
              Reset System
            </button>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Are you absolutely sure?</h3>
            <p className="text-sm text-slate-600 mb-4">
              This action cannot be undone. This will permanently delete all shipments, ETA histories, and tracking logs.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Please type <strong className="select-all">RESET</strong> to confirm.
              </label>
              <input
                type="text"
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
                placeholder="RESET"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetInput('');
                }}
                disabled={resetting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetInput !== 'RESET' || resetting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium cursor-pointer flex items-center gap-2"
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
