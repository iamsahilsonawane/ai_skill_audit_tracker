import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  onStop: (hours: number) => void;
  className?: string;
}

export function Timer({ onStop, className }: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setElapsedSeconds(0);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    const hours = Math.round((elapsedSeconds / 3600) * 10000) / 10000;
    onStop(hours);
    setElapsedSeconds(0);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="font-mono text-lg font-semibold px-3 py-1 bg-secondary rounded-md">
        {formatTime(elapsedSeconds)}
      </div>
      <div className="flex gap-1">
        {!isRunning ? (
          <Button type="button" variant="outline" size="sm" onClick={handleStart} className="h-8 w-8 p-0">
            <Play className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={handleStop} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
            <Square className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
