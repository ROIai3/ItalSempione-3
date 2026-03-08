import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, Navigation, CheckCircle, AlertTriangle } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import ShipmentTable from '../components/ShipmentTable';
import { getDashboardStats, getShipments } from '../services/api';

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

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getShipments({ limit: 10 }),
    ])
      .then(([s, sh]) => {
        setStats(s);
        setShipments(sh.data);
      })
      .finally(() => setLoading(false));
  }, []);

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
    </div>
  );
}
