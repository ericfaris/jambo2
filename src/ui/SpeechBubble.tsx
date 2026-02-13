import { useState, useEffect } from 'react';

interface SpeechBubbleProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function SpeechBubble({ message, visible, onHide }: SpeechBubbleProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 4000); // Auto-hide after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible || !message) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 60,
      right: -20,
      zIndex: 2000,
      animation: 'speechBubbleFadeIn 0.3s ease-out',
    }}>
      <img
        src="/assets/bubble/speech_bubble.png"
        alt="Speech bubble"
        style={{
          width: 240,
          height: 'auto',
          maxWidth: 240,
          display: 'block',
        }}
        draggable={false}
      />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'black',
        fontSize: 16,
        fontWeight: 600,
        textAlign: 'center',
        maxWidth: 200,
        lineHeight: 1.4,
        textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
      }}>
        {message}
      </div>
      <style>{`
        @keyframes speechBubbleFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}