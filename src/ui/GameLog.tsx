import { useEffect, useRef } from 'react';
import type { GameLogEntry } from '../engine/types.ts';

interface GameLogProps {
  log: GameLogEntry[];
}

export function GameLog({ log }: GameLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  const recent = log.slice(-50);

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 8,
      border: '1px solid #3a4a6a',
      height: 180,
      overflowY: 'auto',
      padding: 8,
      fontSize: 11,
      lineHeight: 1.6,
    }}>
      {recent.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Game log will appear here...</div>
      )}
      {recent.map((entry, i) => (
        <div key={i} style={{
          color: entry.player === 1 ? '#D4A574' : 'var(--text)',
          opacity: i < recent.length - 10 ? 0.6 : 1,
        }}>
          <span style={{ color: 'var(--text-muted)' }}>T{entry.turn}</span>{' '}
          <span style={{ fontWeight: 600 }}>P{entry.player + 1}</span>{' '}
          <span>{entry.action}</span>
          {entry.details && (
            <span style={{ color: 'var(--text-muted)' }}> - {entry.details}</span>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
