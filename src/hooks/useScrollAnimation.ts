import { useRef, useState, useEffect } from 'react';

interface ScrollOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

export function useScrollAnimation(options: ScrollOptions = {}) {
  const { threshold = 0.15, triggerOnce = true, root = null, rootMargin = '0px' } = options;
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) {
          observer.disconnect();
        }
      } else {
        if (!triggerOnce) {
          setIsVisible(false);
        }
      }
    }, { threshold, root, rootMargin });

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return { ref, isVisible };
}
