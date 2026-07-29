import { motion } from 'motion/react';

interface TimelineEvent {
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative space-y-7 pl-6">
      {/* Vertical line connecting events */}
      <div className="absolute bottom-2 left-[11px] top-2 w-px rounded-full bg-border" />

      {events.map((event, index) => {
        const isCompleted = event.status === 'completed';
        const isCurrent = event.status === 'current';
        const isUpcoming = event.status === 'upcoming';

        return (
          <div key={index} className="relative">
            {/* Status node */}
            <div
              className={`absolute -left-6 top-1 z-10 flex h-[14px] w-[14px] items-center justify-center rounded-full border-2 bg-black transition-colors ${
                isCompleted
                  ? 'border-accent'
                  : isCurrent
                    ? 'border-iris-cyan animate-pulse-teal'
                    : 'border-border'
              }`}
            >
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                />
              )}
            </div>

            {/* Content */}
            <div className={`flex flex-col ${isUpcoming ? 'opacity-45' : ''}`}>
              <span
                className={`text-sm font-semibold ${
                  isCurrent ? 'text-iris-cyan' : 'text-white'
                }`}
              >
                {event.title}
              </span>
              <span className="mt-1 text-xs leading-relaxed text-text-secondary">
                {event.description}
              </span>
              <span className="mt-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {event.date}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
