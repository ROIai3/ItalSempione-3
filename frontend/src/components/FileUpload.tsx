import { useState, useRef, type DragEvent } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  onUpload: (file: File) => Promise<void>;
}

const ACCEPT = '.xlsx,.xls,.csv';
const MAX_SIZE = 10 * 1024 * 1024;

export default function FileUpload({ onUpload }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setResult(null);
    setError('');
    if (f.size > MAX_SIZE) {
      setError('File exceeds 10MB limit.');
      return;
    }
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setError('Only .xlsx, .xls, and .csv files are accepted.');
      return;
    }
    setFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      await onUpload(file);
      setResult('success');
      setFile(null);
    } catch {
      setResult('error');
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-white'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Drag & drop or click to upload</p>
        <p className="text-sm text-slate-400 mt-1">.xlsx, .xls, .csv (max 10MB)</p>
      </div>

      {file && (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-4">
          <FileSpreadsheet className="w-8 h-8 text-green-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}

      {result === 'success' && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">File uploaded successfully!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
