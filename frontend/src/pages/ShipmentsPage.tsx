import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ShipmentTable from '../components/ShipmentTable';
import Pagination from '../components/Pagination';
import { getShipments, deleteShipment, deleteBulkShipments, triggerTracking } from '../services/api';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (activeOnly) params.is_active = true;
      if (mblSearch.trim()) params.mbl = mblSearch.trim();
      const res = await getShipments(params);
      setShipments(res.data?.shipments || []);
      setTotal(res.data?.pagination?.total || 0);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, activeOnly, mblSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT) || 1;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (ids: string[], isChecked: boolean) => {
    if (isChecked) {
      const newIds = new Set([...selectedIds, ...ids]);
      setSelectedIds(Array.from(newIds));
    } else {
      setSelectedIds(selectedIds.filter((id) => !ids.includes(id)));
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shipment?')) return;
    try {
      await deleteShipment(id);
      fetchData();
    } catch (err) {
      alert('Error deleting shipment');
    }
  };

  const handleDeleteBulk = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} shipments?`)) return;
    try {
      await deleteBulkShipments(selectedIds);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      alert('Error deleting shipments');
    }
  };

  const handleTrackSingle = async (id: string) => {
    try {
      await triggerTracking(id);
      fetchData();
    } catch (err) {
      alert('Error triggering tracking');
    }
  };

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4">
          <span className="text-blue-800 font-medium">{selectedIds.length} shipments selected</span>
          <button 
            type="button"
            onClick={handleDeleteBulk}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 cursor-pointer"
          >
            Delete Selected
          </button>
        </div>
      )}
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
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onDeleteSingle={handleDeleteSingle}
        onTrackSingle={handleTrackSingle}
        onRowClick={(id) => navigate(`/shipments/${id}`)}
        loading={loading}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
