import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
    freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
    options: UseIntersectionObserverOptions = {}
) {
    const { threshold = 0, root = null, rootMargin = '0%', freezeOnceVisible = false } = options;

    const [entry, setEntry] = useState<IntersectionObserverEntry>();
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    const frozen = useRef(false);

    const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
        const isIntersecting = entry.isIntersecting;

        if (freezeOnceVisible && isIntersecting) {
            frozen.current = true;
        }

        if (!frozen.current) {
            setEntry(entry);
            setIsVisible(isIntersecting);
        }
    };

    useEffect(() => {
        const node = elementRef?.current;
        const hasIOSupport = !!window.IntersectionObserver;

        if (!hasIOSupport || frozen.current || !node) return;

        const observerParams = { threshold, root, rootMargin };
        const observer = new IntersectionObserver(updateEntry, observerParams);

        observer.observe(node);

        return () => observer.disconnect();
    }, [elementRef, threshold, root, rootMargin]);

    return { ref: elementRef, entry, isVisible };
}