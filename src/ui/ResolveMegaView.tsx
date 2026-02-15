import type { ReactNode } from 'react';

interface ResolveMegaViewProps {
  children: ReactNode;
  verticalAlign?: 'top' | 'center';
}

export function ResolveMegaView({ children, verticalAlign = 'top' }: ResolveMegaViewProps) {
  return (
    <div
      className="overlay-fade"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(20,10,5,0.85)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: verticalAlign === 'center' ? 'center' : 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(8px, 3vw, 24px)',
        overflowY: 'auto',
      }}
    >
      <div
        className="dialog-pop"
        style={{
          width: 'min(980px, 100%)',
          maxHeight: 'calc(100vh - 16px)',
          overflowY: 'auto',
          border: 'none',
          background: 'transparent',
          boxShadow: 'none',
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
