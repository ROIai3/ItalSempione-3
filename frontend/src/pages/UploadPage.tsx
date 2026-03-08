import { useEffect, useState } from 'react';
import FileUpload from '../components/FileUpload';
import { uploadExcel, getBatches } from '../services/api';

interface Batch {
  id: string;
  filename: string;
  row_count: number;
  status: string;
  uploaded_at: string;
}

export default function UploadPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      const res = await getBatches();
      setBatches(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const handleUpload = async (file: File) => {
    await uploadExcel(file);
    fetchBatches();
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusStyle: Record<string, string> = {
    completed: 'text-green-600',
    processing: 'text-blue-600',
    failed: 'text-red-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Upload Shipment File</h2>
        <FileUpload onUpload={handleUpload} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Upload History</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
            </div>
          ) : batches.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No uploads yet.</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Filename', 'Rows', 'Status', 'Uploaded'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{b.filename}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{b.row_count}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span className={statusStyle[b.status] || 'text-slate-500'}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{fmtDate(b.uploaded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
