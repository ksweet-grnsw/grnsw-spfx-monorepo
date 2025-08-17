import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Accessibility announcement levels
 */
export type AriaLive = 'off' | 'polite' | 'assertive';

/**
 * Hook for managing screen reader announcements
 */
export function useAnnounce() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create invisible announcement element
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    
    document.body.appendChild(announcer);
    announceRef.current = announcer;

    return () => {
      if (announceRef.current && document.body.contains(announceRef.current)) {
        document.body.removeChild(announceRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, level: AriaLive = 'polite') => {
    if (!announceRef.current) return;
    
    announceRef.current.setAttribute('aria-live', level);
    announceRef.current.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  return announce;
}

/**
 * Hook for managing focus trap within a container
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Get focusable elements
    const getFocusableElements = () => {
      if (!containerRef.current) return [];
      
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(',');
      
      return Array.from(containerRef.current.querySelectorAll(selectors)) as HTMLElement[];
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore previous focus
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing roving tabindex in lists
 */
export function useRovingTabIndex(items: any[], isActive: boolean = true) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const handleKeyDown = useCallback((e: KeyboardEvent, index: number) => {
    if (!isActive) return;

    let nextIndex = index;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (index + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = index === 0 ? items.length - 1 : index - 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    setFocusedIndex(nextIndex);
    itemRefs.current[nextIndex]?.focus();
  }, [items.length, isActive]);

  const getItemProps = useCallback((index: number) => ({
    ref: (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    tabIndex: focusedIndex === index ? 0 : -1,
    onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e.nativeEvent, index),
    onFocus: () => setFocusedIndex(index)
  }), [focusedIndex, handleKeyDown]);

  return {
    focusedIndex,
    getItemProps
  };
}

/**
 * Hook for skip navigation links
 */
export function useSkipLinks() {
  const [skipLinks] = useState([
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'navigation', label: 'Skip to navigation' },
    { id: 'search', label: 'Skip to search' },
    { id: 'footer', label: 'Skip to footer' }
  ]);

  const skipTo = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return { skipLinks, skipTo };
}

/**
 * Hook for managing ARIA descriptions
 */
export function useAriaDescriptions() {
  const [descriptions, setDescriptions] = useState<Map<string, string>>(new Map());
  const descriptionIdCounter = useRef(0);

  const addDescription = useCallback((text: string): string => {
    const id = `aria-desc-${++descriptionIdCounter.current}`;
    setDescriptions(prev => new Map(prev).set(id, text));
    return id;
  }, []);

  const removeDescription = useCallback((id: string) => {
    setDescriptions(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const getDescriptionProps = useCallback((id: string) => ({
    'aria-describedby': id,
    'data-description': descriptions.get(id)
  }), [descriptions]);

  return {
    addDescription,
    removeDescription,
    getDescriptionProps,
    descriptions
  };
}

/**
 * Hook for high contrast mode detection
 */
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    // Set initial value
    setIsHighContrast(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return isHighContrast;
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for managing focus visible state
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const lastInteractionWasKeyboard = useRef(false);

  useEffect(() => {
    const handleKeyDown = () => {
      lastInteractionWasKeyboard.current = true;
    };

    const handleMouseDown = () => {
      lastInteractionWasKeyboard.current = false;
    };

    const handleFocus = () => {
      if (lastInteractionWasKeyboard.current) {
        setIsFocusVisible(true);
      }
    };

    const handleBlur = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  return isFocusVisible;
}