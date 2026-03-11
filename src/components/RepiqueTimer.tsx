import { useState, useEffect, memo } from 'react';
import { Clock, Check } from 'lucide-react';

interface RepiqueTimerProps {
  assignedAt: string;
  repiqueMinutes: number;
  contacted: boolean;
  repiqueCount: number;
  showCountdown?: boolean;
}

export const RepiqueTimer = memo(function RepiqueTimer({
  assignedAt,
  repiqueMinutes,
  contacted,
  repiqueCount,
  showCountdown = true
}: RepiqueTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (contacted || !showCountdown) return;

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

  // Lead foi atendido (contato WhatsApp feito)
  if (contacted) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
        title="Lead atendido"
      >
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </span>
    );
  }

  // Lead atingiu 3 repiques E o tempo expirou — não será mais redistribuído
  if (repiqueCount >= 3 && (secondsLeft === 0 || secondsLeft === null)) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-xs font-mono font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
        title="Lead redistribuído 3 vezes — limite atingido"
      >
        3X
      </span>
    );
  }

  if (secondsLeft === null) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = secondsLeft <= 120 && secondsLeft > 60;
  const isCritical = secondsLeft <= 60;

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
      title={secondsLeft === 0 ? 'Tempo esgotado — aguardando redistribuição' : `Tempo restante para atendimento: ${timeStr}`}
    >
      <Clock className="w-3 h-3" />
      {secondsLeft === 0 ? '0:00' : timeStr}
    </span>
  );
});
