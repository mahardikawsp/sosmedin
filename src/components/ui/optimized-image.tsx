'use client';

import Image from 'next/image';
import { useState, memo } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    sizes?: string;
    fill?: boolean;
    quality?: number;
}

const OptimizedImage = memo<OptimizedImageProps>(({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    placeholder = 'empty',
    blurDataURL,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    fill = false,
    quality = 75,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Generate a simple blur placeholder if none provided
    const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setHasError(true);
        setIsLoading(false);
    };

    if (hasError) {
        return (
            <div
                className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
                style={{ width, height }}
            >
                <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>
        );
    }

    return (
        <div className={`relative ${isLoading ? 'animate-pulse bg-gray-200 dark:bg-gray-700' : ''}`}>
            <Image
                src={src}
                alt={alt}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                fill={fill}
                className={className}
                priority={priority}
                placeholder={placeholder}
                blurDataURL={blurDataURL || defaultBlurDataURL}
                sizes={sizes}
                quality={quality}
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    objectFit: 'cover',
                }}
            />
        </div>
    );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;