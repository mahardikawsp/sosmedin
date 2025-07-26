import { useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualScrollOptions {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
}

export function useVirtualScroll<T>(
    items: T[],
    options: VirtualScrollOptions
) {
    const { itemHeight, containerHeight, overscan = 5 } = options;
    const [scrollTop, setScrollTop] = useState(0);

    const visibleRange = useMemo(() => {
        const visibleStart = Math.floor(scrollTop / itemHeight);
        const visibleEnd = Math.min(
            visibleStart + Math.ceil(containerHeight / itemHeight),
            items.length - 1
        );

        const start = Math.max(0, visibleStart - overscan);
        const end = Math.min(items.length - 1, visibleEnd + overscan);

        return { start, end };
    }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

    const visibleItems = useMemo(() => {
        return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
            item,
            index: visibleRange.start + index,
        }));
    }, [items, visibleRange]);

    const totalHeight = items.length * itemHeight;
    const offsetY = visibleRange.start * itemHeight;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return {
        visibleItems,
        totalHeight,
        offsetY,
        handleScroll,
    };
}