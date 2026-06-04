import { formatTimeLabel } from "@/lib/activity-time";

type BansosPeriodLike = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatBansosPeriod(period: BansosPeriodLike) {
  const dateLabel =
    period.startDate === period.endDate
      ? formatDateLabel(period.startDate)
      : `${formatDateLabel(period.startDate)} - ${formatDateLabel(period.endDate)}`;

  return `${dateLabel} • ${formatTimeLabel(period.startTime)} - ${formatTimeLabel(period.endTime)} WIB`;
}
