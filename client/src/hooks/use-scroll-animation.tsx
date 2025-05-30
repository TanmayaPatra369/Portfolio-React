import { useEffect, useRef, useState } from "react";

interface ScrollAnimationOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  once?: boolean;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: ScrollAnimationOptions = {}
) {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = "0px",
    once = true, // Default to true to ensure animations only run once
  } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    // Create observer instance
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting) {
          // Element is visible in viewport
          setIsVisible(true);
          
          // If once is true, we only want to trigger the animation once
          if (once) {
            setHasAnimated(true);
            // Unobserve after animating once
            if (observerRef.current && currentRef) {
              observerRef.current.unobserve(currentRef);
            }
          }
        } else if (!once || !hasAnimated) {
          // Element is out of viewport and we want to reset the animation
          setIsVisible(false);
        }
      },
      {
        root,
        // Adjust rootMargin to trigger animation earlier
        rootMargin: rootMargin || "50px",
        threshold,
      }
    );

    // Start observing
    observerRef.current.observe(currentRef);

    // Cleanup function
    return () => {
      if (currentRef && observerRef.current) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [threshold, root, rootMargin, once, hasAnimated]);

  return { ref, isVisible };
}

interface ScrollDirectionOptions {
  initialDirection?: "up" | "down" | null;
}

export function useScrollDirection(options: ScrollDirectionOptions = {}) {
  const { initialDirection = null } = options;
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    initialDirection
  );
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > prevScrollY) {
        setScrollDirection("down");
      } else if (currentScrollY < prevScrollY) {
        setScrollDirection("up");
      }
      
      setPrevScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [prevScrollY]);

  return scrollDirection;
}

export function useScrollCompression<T extends HTMLElement = HTMLDivElement>(
  options: ScrollAnimationOptions = {}
) {
  const { ref, isVisible } = useScrollAnimation<T>(options);
  const [isCompressed, setIsCompressed] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // When element moves to top 20% of viewport, start compression
      if (rect.top < viewportHeight * 0.2 && rect.bottom > 0) {
        const scrollProgress = 1 - (rect.bottom / viewportHeight);
        setIsCompressed(scrollProgress > 0.3);
      } else {
        setIsCompressed(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return { ref, isVisible, isCompressed };
}