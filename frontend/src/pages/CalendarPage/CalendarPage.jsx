import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, Bell } from 'lucide-react';

const generateEvents = () => {
  const now = new Date();
  
  // Create a demo event exactly 30 minutes and 5 seconds from now
  const demoEventTime = new Date(now.getTime() + (30 * 60000) + 5000);
  
  // Other realistic upcoming events
  const tomorrow = new Date(now.getTime() + (24 * 60 * 60000));
  const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60000));

  return [
    { 
      id: 1, 
      dateObj: demoEventTime,
      time: demoEventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      dateLabel: 'Today',
      country: 'US', 
      title: 'Federal Reserve Interest Rate Decision (DEMO)', 
      actual: '-', consensus: '5.25%', previous: '5.25%', impact: 'High' 
    },
    { 
      id: 2, 
      dateObj: new Date(now.getTime() + (3 * 3600000)), // 3 hours from now
      time: new Date(now.getTime() + (3 * 3600000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      dateLabel: 'Today',
      country: 'EU', 
      title: 'ECB Press Conference', 
      actual: '-', consensus: '-', previous: '-', impact: 'High' 
    },
    { 
      id: 3, 
      dateObj: tomorrow,
      time: '08:30 AM', 
      dateLabel: tomorrow.toLocaleDateString(),
      country: 'US', 
      title: 'Non-Farm Employment Change', 
      actual: '-', consensus: '180K', previous: '175K', impact: 'High' 
    },
    { 
      id: 4, 
      dateObj: tomorrow,
      time: '09:30 PM', 
      dateLabel: tomorrow.toLocaleDateString(),
      country: 'CN', 
      title: 'Manufacturing PMI', 
      actual: '-', consensus: '50.2', previous: '50.4', impact: 'High' 
    },
    { 
      id: 5, 
      dateObj: nextWeek,
      time: '02:00 AM', 
      dateLabel: nextWeek.toLocaleDateString(),
      country: 'UK', 
      title: 'CPI YoY', 
      actual: '-', consensus: '2.1%', previous: '2.3%', impact: 'High' 
    },
  ];
};

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState({});

  useEffect(() => {
    setEvents(generateEvents());
    
    // Request notification permission if not granted
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  const handleSetAlert = (event) => {
    // If already active, toggle off
    if (activeAlerts[event.id]) {
      setActiveAlerts(prev => ({ ...prev, [event.id]: false }));
      return;
    }

    // Toggle on
    setActiveAlerts(prev => ({ ...prev, [event.id]: true }));

    const timeUntilEventMs = event.dateObj.getTime() - Date.now();
    const thirtyMinsMs = 30 * 60000;
    const delayMs = timeUntilEventMs - thirtyMinsMs;

    if (delayMs <= 0) {
      alert("This event starts in less than 30 minutes! Alert cannot be scheduled for 30-mins prior.");
      return;
    }

    // Schedule notification exactly 30 mins before the event starts
    setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("Upcoming Macro Event!", {
          body: `${event.title} (${event.country}) is starting in exactly 30 minutes at ${event.time}!`,
          icon: '/favicon.ico'
        });
      } else {
        alert(`ALERT: ${event.title} (${event.country}) is starting in 30 minutes!`);
      }
    }, delayMs);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Economic Calendar</h1>
          <p className="page-subtitle">Track market-moving events and macro releases worldwide.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn--secondary"><Filter size={16} /> Filters</button>
          <button className="btn btn--primary"><CalendarIcon size={16} /> Today</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time (Local)</th>
              <th>Country</th>
              <th>Event</th>
              <th>Impact</th>
              <th>Actual</th>
              <th>Consensus</th>
              <th>Previous</th>
              <th>Alerts</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td className="font-semibold text-brand">{ev.dateLabel}</td>
                <td className="text-muted">{ev.time}</td>
                <td><span className="badge">{ev.country}</span></td>
                <td className="font-semibold">{ev.title}</td>
                <td>
                  <span className={`badge ${ev.impact === 'High' ? 'bg-danger-light text-danger' : 'bg-warning-light text-warning'}`}>
                    {ev.impact}
                  </span>
                </td>
                <td className="font-bold">{ev.actual}</td>
                <td className="text-muted">{ev.consensus}</td>
                <td className="text-muted">{ev.previous}</td>
                <td>
                  {activeAlerts[ev.id] ? (
                     <button className="btn btn--ghost" style={{ padding: '4px 8px', color: 'var(--success-color)', background: 'var(--success-color-light)' }} onClick={() => handleSetAlert(ev)}>
                       <Bell size={14} fill="currentColor" /> Active
                     </button>
                  ) : (
                     <button className="btn btn--secondary btn--sm" onClick={() => handleSetAlert(ev)}>
                       <Bell size={14} /> Set
                     </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
