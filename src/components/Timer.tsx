import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  onTimeUpdate?: (hours: number) => void;
  initialHours?: number;
  className?: string;
}

export function Timer({ onTimeUpdate, initialHours = 0, className }: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(initialHours * 3600);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          const newSeconds = prev + 1;
          const hours = newSeconds / 3600;
          onTimeUpdate?.(Math.round(hours * 100) / 100); // Round to 2 decimal places
          return newSeconds;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUpdate]);

  // Update elapsed time when initialHours changes (for existing logs)
  useEffect(() => {
    if (!isRunning) {
      setElapsedSeconds(initialHours * 3600);
    }
  }, [initialHours, isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    onTimeUpdate?.(0);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="font-mono text-lg font-semibold px-3 py-1 bg-secondary rounded-md">
        {formatTime(elapsedSeconds)}
      </div>
      <div className="flex gap-1">
        {!isRunning ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStart}
            className="h-8 w-8 p-0"
          >
            <Play className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePause}
            className="h-8 w-8 p-0"
          >
            <Pause className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}