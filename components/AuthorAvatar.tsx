const COLORS = [
  '#1a1a1a', '#333333', '#4a4a4a', '#555555',
  '#666666', '#777777', '#888888', '#999999',
]

function nameToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % COLORS.length
  }
  return COLORS[hash]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface AuthorAvatarProps {
  name: string
  size?: number
}

export function AuthorAvatar({ name, size = 32 }: AuthorAvatarProps) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: nameToColor(name),
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: `${Math.round(size * 0.34)}px`,
        fontWeight: 700,
        color: '#fff',
        userSelect: 'none',
      }}
      role="img"
      aria-label={name.trim() || 'Unknown author'}
    >
      <span aria-hidden="true">{getInitials(name)}</span>
    </div>
  )
}
