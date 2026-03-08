import { AlertTriangle } from 'lucide-react';

interface Props {
  eta: string | null;
  etaChanged?: boolean;
}

export default function EtaIndicator({ eta, etaChanged }: Props) {
  if (!eta) {
    return <span className="text-gray-400 text-sm">N/A</span>;
  }

  const formatted = new Date(eta).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (etaChanged) {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm" title="ETA changed">
        <AlertTriangle className="w-3.5 h-3.5" />
        {formatted}
      </span>
    );
  }

  return <span className="text-sm text-slate-700">{formatted}</span>;
}
