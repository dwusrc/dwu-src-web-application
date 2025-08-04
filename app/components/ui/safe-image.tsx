'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fallbackIcon,
  fallbackText = 'No image available'
}: SafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (imageError) {
    return (
      <div className={`bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          {fallbackIcon || (
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          )}
          <p className="text-sm">{fallbackText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-100 ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#359d49]"></div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        priority={priority}
      />
    </div>
  );
} 