interface StatusBadgeProps {
  status: string;
  color: 'green' | 'amber' | 'red';
}

const COLOR_MAP = {
  green: 'bg-[#1a5c2a] text-[#8ed8a8] border border-[#1a5c2a]/50',
  amber: 'bg-[#5c4510] text-[#f0d080] border border-[#5c4510]/50',
  red: 'bg-[#6b1818] text-[#f0a0a0] border border-[#6b1818]/50',
};

const DOT_MAP = {
  green: 'bg-[#8ed8a8]',
  amber: 'bg-[#f0d080]',
  red: 'bg-[#f0a0a0]',
};

export default function StatusBadge({ status, color }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${COLOR_MAP[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_MAP[color]}`} />
      {status}
    </span>
  );
}
