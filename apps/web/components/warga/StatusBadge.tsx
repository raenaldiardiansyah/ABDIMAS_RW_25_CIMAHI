import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  color: 'green' | 'amber' | 'red';
}

const COLOR_MAP = {
  green: 'bg-[color:var(--status-success)]/14 text-[color:var(--status-success)] border border-[color:var(--status-success)]/35',
  amber: 'bg-[color:var(--status-warning)]/14 text-[color:var(--status-warning)] border border-[color:var(--status-warning)]/35',
  red: 'bg-[color:var(--status-error)]/14 text-[color:var(--status-error)] border border-[color:var(--status-error)]/35',
};

const DOT_MAP = {
  green: 'bg-[color:var(--status-success)]',
  amber: 'bg-[color:var(--status-warning)]',
  red: 'bg-[color:var(--status-error)]',
};

export default function StatusBadge({ status, color }: StatusBadgeProps) {
  return (
    <Badge className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${COLOR_MAP[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_MAP[color]}`} />
      {status}
    </Badge>
  );
}
