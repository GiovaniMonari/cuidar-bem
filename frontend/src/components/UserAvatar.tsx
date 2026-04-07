'use client';

interface Props {
  name?: string;
  avatar?: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, avatar, size = 40, className = '' }: Props) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name || 'Avatar'}
        width={size}
        height={size}
        className={`rounded-full object-cover border border-gray-200 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-bold flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}