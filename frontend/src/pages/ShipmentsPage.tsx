import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ShipmentTable from '../components/ShipmentTable';
import Pagination from '../components/Pagination';
import { getShipments } from '../services/api';

const LIMIT = 25;

const statuses = ['all', 'pending', 'in_transit', 'arrived', 'delivered', 'completed'];

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [mblSearch, setMblSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (activeOnly) params.is_active = true;
      if (mblSearch.trim()) params.mbl = mblSearch.trim();
      const res = await getShipments(params);
      setShipments(res.data);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, activeOnly, mblSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <input
          type="text"
          placeholder="Search MBL..."
          value={mblSearch}
          onChange={(e) => { setMblSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }}
            className="rounded border-slate-300"
          />
          Active only
        </label>

        <span className="ml-auto text-sm text-slate-400">{total} shipments</span>
      </div>

      <ShipmentTable
        shipments={shipments}
        onRowClick={(id) => navigate(`/shipments/${id}`)}
        loading={loading}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
