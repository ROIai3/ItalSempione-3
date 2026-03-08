const statusStyles: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_transit: 'bg-blue-100 text-blue-700',
  arrived: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  unknown: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

function toTitleCase(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || statusStyles.unknown;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {toTitleCase(status)}
    </span>
  );
}
