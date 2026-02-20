interface AvatarBadgeProps {
  avatarUrl: string | null;
  avatarLabel: string;
  onClick?: () => void;
}

export function AvatarBadge({ avatarUrl, avatarLabel, onClick }: AvatarBadgeProps) {
  return (
    <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 50 }}>
      <button
        onClick={onClick}
        style={{
          width: 42,
          height: 42,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface-light)',
          border: '1px solid var(--border-light)',
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
        }}
        title="Profile"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="User avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text)',
          }}>
            {avatarLabel}
          </span>
        )}
      </button>
    </div>
  );
}
