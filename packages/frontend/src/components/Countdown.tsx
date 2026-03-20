"use client";

import { useState, useEffect } from "react";

// April 6, 2026 00:00:00 UTC
const TARGET_DATE = new Date("2026-04-06T00:00:00Z").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft | null {
  const now = Date.now();
  const diff = TARGET_DATE - now;
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft());
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-1 text-sm text-zinc-500">
        <span className="font-mono">--:--:--:--</span>
        <span className="ml-1">left</span>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="text-center text-sm font-medium text-accent-400">
        Campaign ended
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <CountdownUnit value={timeLeft.days} label="days" />
      <span className="text-xl font-bold text-zinc-600">:</span>
      <CountdownUnit value={timeLeft.hours} label="hrs" />
      <span className="text-xl font-bold text-zinc-600">:</span>
      <CountdownUnit value={timeLeft.minutes} label="min" />
      <span className="text-xl font-bold text-zinc-600">:</span>
      <CountdownUnit value={timeLeft.seconds} label="sec" />
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl font-bold tabular-nums text-white sm:text-3xl">
        {pad(value)}
      </span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500">
        {label}
      </span>
    </div>
  );
}
