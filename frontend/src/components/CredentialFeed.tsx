"use client";

import { useEffect, useState } from "react";
import { Award, UserCircle } from "lucide-react";

type CredentialEvent = {
  id: string;
  artist: string;
  skill: string;
  amount: string;
  timestamp: Date;
};

export default function CredentialFeed() {
  const [events, setEvents] = useState<CredentialEvent[]>([]);

  useEffect(() => {
    // Simulate real-time events coming from Soroban
    const mockEvents: CredentialEvent[] = [
      {
        id: "1",
        artist: "GBM...4K2",
        skill: "Bharatanatyam",
        amount: "50",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
      },
      {
        id: "2",
        artist: "GDC...9L1",
        skill: "Carnatic Music",
        amount: "150",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
      },
    ];
    setEvents(mockEvents);
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[500px] flex flex-col">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
        <Award className="w-5 h-5 mr-2 text-orange-500" />
        Live Credentials
      </h2>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No credentials yet.</p>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="p-4 rounded-lg bg-orange-50 border border-orange-100 flex items-start space-x-3"
            >
              <UserCircle className="w-8 h-8 text-orange-400 shrink-0" />
              <div>
                <p className="text-sm text-gray-800 font-medium">
                  Artist <span className="font-mono text-xs">{evt.artist}</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Endorsed for <span className="font-semibold text-orange-700">{evt.skill}</span>
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500 space-x-3">
                  <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">
                    +{evt.amount} XLM
                  </span>
                  <span>{evt.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
