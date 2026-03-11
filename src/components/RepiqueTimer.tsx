import { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';

interface RepiqueTimerProps {
  assignedAt: string;
  repiqueMinutes: number;
  /** If true, WhatsApp contact was already made — hide the timer */
  contacted: boolean;
  /** repique_count >= 3 means no more repiques */
  repiqueCount: number;
}

export const RepiqueTimer = memo(function RepiqueTimer({
  assignedAt,
  repiqueMinutes,
  contacted,
  repiqueCount
}: RepiqueTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (contacted || repiqueCount >= 3) return;

    const deadline = new Date(assignedAt).getTime() + repiqueMinutes * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((deadline - now) / 1000));
      setSecondsLeft(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [assignedAt, repiqueMinutes, contacted, repiqueCount]);

  if (contacted || repiqueCount >= 3 || secondsLeft === null) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Color states
  const isWarning = secondsLeft <= 120 && secondsLeft > 60; // ≤2min
  const isCritical = secondsLeft <= 60; // ≤1min
  const isExpired = secondsLeft === 0;

  let colorClasses = 'text-muted-foreground bg-muted/50';
  if (isWarning) {
    colorClasses = 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30';
  }
  if (isCritical) {
    colorClasses = 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30 animate-repique-blink';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-1.5 py-0.5 rounded-md ${colorClasses}`}
      title={isExpired ? 'Tempo esgotado — aguardando redistribuição' : `Tempo restante para atendimento: ${timeStr}`}
    >
      <Clock className="w-3 h-3" />
      {isExpired ? '0:00' : timeStr}
    </span>
  );
});
