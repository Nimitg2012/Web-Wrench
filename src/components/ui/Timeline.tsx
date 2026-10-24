import type { TimelineEvent } from '../../types/index.ts'
import { STATUS_COLOR } from '../../utils/format.ts'

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol>
      {events.map((event, index) => (
        <li key={`${event.time}-${event.title}`} className="relative flex gap-3 pb-4 last:pb-0">
          {index < events.length - 1 ? <span className="absolute top-4 left-[6px] h-[calc(100%-8px)] w-px bg-line" /> : null}
          <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-midnight" style={{ background: STATUS_COLOR[event.tone] }} />
          <div>
            <p className="text-xs text-muted">{event.time}</p>
            <p className="text-sm font-medium text-ink">{event.title}</p>
            <p className="text-sm leading-6 text-muted">{event.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
