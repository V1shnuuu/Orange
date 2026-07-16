import React from 'react';
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
    <div className="relative pl-6 space-y-8">
      {/* Vertical line connecting events */}
      <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-border rounded-full" />
      
      {events.map((event, index) => {
        const isCompleted = event.status === 'completed';
        const isCurrent = event.status === 'current';
        
        return (
          <div key={index} className="relative">
            {/* Status node */}
            <div className={`absolute -left-6 top-1 w-[14px] h-[14px] rounded-full border-2 bg-bg-primary z-10 transition-colors ${
              isCompleted ? 'border-accent' : isCurrent ? 'border-accent animate-pulse-teal' : 'border-border'
            }`}>
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0.5 bg-accent rounded-full"
                />
              )}
            </div>
            
            {/* Content */}
            <div className={`flex flex-col ${isUpcoming(event.status) ? 'opacity-50' : 'opacity-100'}`}>
              <span className={`text-sm font-semibold ${isCurrent ? 'text-accent' : 'text-text-primary'}`}>
                {event.title}
              </span>
              <span className="text-xs text-text-secondary mt-1">{event.description}</span>
              <span className="text-[10px] font-mono text-text-muted mt-2 uppercase tracking-wider">{event.date}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function isUpcoming(status: string) {
  return status === 'upcoming';
}
