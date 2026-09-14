import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function toDateStr(d) {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MONTHS = [
  "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
  "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac",
];
const DAYS = ["NED", "PON", "UTO", "SRI", "ČET", "PET", "SUB"];

function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

function sameDay(a, b) {
  return a && b && a.toDateString() === b.toDateString();
}

function isDateBlocked(date, blockedDates) {
  if (!date || !blockedDates || blockedDates.length === 0) return false;
  return blockedDates.includes(toDateStr(date));
}

// dan odjave se ne racuna kao blokiran, zato krece od from+1
function hasBlockedDayBetween(start, end, blockedDates) {
  if (!blockedDates || blockedDates.length === 0) return false;
  const from = start < end ? start : end;
  const to = start < end ? end : start;
  const cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor < to) {
    if (isDateBlocked(cursor, blockedDates)) return true;
    cursor.setDate(cursor.getDate() + 1);
  }
  return false;
}

export default function Calendar({ checkIn, checkOut, onSelect, compact = false, blockedDates = [] }) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const cells = buildMonth(view.getFullYear(), view.getMonth());

  const handleClick = (date) => {
    if (!date) return;
    if (!checkIn || (checkIn && checkOut)) {
      onSelect(date, null);
    } else if (date < checkIn || hasBlockedDayBetween(checkIn, date, blockedDates)) {

      onSelect(date, null);
    } else {
      onSelect(checkIn, date);
    }
  };

  const inRange = (date) =>
    checkIn && checkOut && date > checkIn && date < checkOut;

  return (
    <div className={`rounded-lg border border-line bg-white card-shadow ${compact ? "p-3" : "p-5"}`}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink hover:border-brand hover:text-brand"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-display text-sm font-bold text-ink">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </p>
        <button
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink hover:border-brand hover:text-brand"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={`grid grid-cols-7 gap-1 text-center ${compact ? "mt-2" : "mt-4"}`}>
        {DAYS.map((d) => (
          <span key={d} className={`font-semibold text-muted ${compact ? "py-0.5 text-[9px]" : "py-1 text-[10px]"}`}>
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          const isStart = sameDay(date, checkIn);
          const isEnd = sameDay(date, checkOut);
          const isSelected = isStart || isEnd;
          const isPast = date && date < new Date(today.toDateString());
          const isBlocked = isDateBlocked(date, blockedDates);
          const disabled = isPast || isBlocked;

          let dayClass = "text-ink hover:bg-sky-bg";
          if (!date) dayClass = "invisible";
          else if (disabled) dayClass = "text-slate-300 line-through decoration-slate-300";
          else if (isSelected) dayClass = "bg-brand text-white hover:bg-brand";
          else if (inRange(date)) dayClass = "bg-sky-bg text-ink";

          return (
            <button
              key={i}
              disabled={!date || disabled}
              title={isBlocked ? "Već rezervisano" : undefined}
              onClick={() => handleClick(date)}
              className={`relative aspect-square rounded-md font-medium transition-colors ${compact ? "text-xs" : "text-sm"} ${dayClass}`}
            >
              {date?.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
