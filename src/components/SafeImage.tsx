import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackTitle,
  ...rest
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EDE5D8]/50 text-[#111111]/60 select-none ${className}`}
        role="img"
        aria-label={alt || fallbackTitle || 'CASA STYLE'}
      >
        <svg
          className="w-8 h-8 mb-2 text-[#B89B72]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <span className="text-[11px] tracking-widest uppercase font-medium px-3 text-center line-clamp-1">
          {fallbackTitle || 'CASA STYLE'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
};
