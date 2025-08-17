import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
  global?: boolean;
  preventDefault?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  enableHelp?: boolean;
  onHelpToggle?: (visible: boolean) => void;
}

/**
 * Custom hook for managing keyboard shortcuts
 * Follows SOLID principles with configurable shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): {
  isHelpVisible: boolean;
  toggleHelp: () => void;
  shortcutsList: KeyboardShortcut[];
} {
  const { 
    enabled = true, 
    enableHelp = true,
    onHelpToggle 
  } = options;
  
  const isHelpVisible = useRef(false);
  const activeElement = useRef<Element | null>(null);

  // Format shortcut display string
  const formatShortcut = useCallback((shortcut: KeyboardShortcut): string => {
    const keys: string[] = [];
    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.alt) keys.push('Alt');
    if (shortcut.shift) keys.push('Shift');
    if (shortcut.meta) keys.push('⌘');
    keys.push(shortcut.key.toUpperCase());
    return keys.join('+');
  }, []);

  // Check if we should ignore keyboard events
  const shouldIgnoreKeyboard = useCallback((): boolean => {
    const active = document.activeElement;
    if (!active) return false;
    
    const tagName = active.tagName.toLowerCase();
    const isEditable = (active as HTMLElement).isContentEditable;
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
    
    return isInput || isEditable;
  }, []);

  // Check if shortcut matches event
  const matchesShortcut = useCallback((
    event: KeyboardEvent,
    shortcut: KeyboardShortcut
  ): boolean => {
    const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatches = !shortcut.ctrl || event.ctrlKey;
    const altMatches = !shortcut.alt || event.altKey;
    const shiftMatches = !shortcut.shift || event.shiftKey;
    const metaMatches = !shortcut.meta || event.metaKey;
    
    return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Check for help shortcut (? or Shift+/)
    if (enableHelp && event.key === '?' || (event.shiftKey && event.key === '/')) {
      isHelpVisible.current = !isHelpVisible.current;
      if (onHelpToggle) {
        onHelpToggle(isHelpVisible.current);
      }
      event.preventDefault();
      return;
    }
    
    // Don't process shortcuts if typing in an input
    if (!shortcuts.some(s => s.global) && shouldIgnoreKeyboard()) {
      return;
    }
    
    // Find and execute matching shortcut
    for (const shortcut of shortcuts) {
      if (matchesShortcut(event, shortcut)) {
        // Skip if not global and in input
        if (!shortcut.global && shouldIgnoreKeyboard()) {
          continue;
        }
        
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        
        shortcut.handler();
        break;
      }
    }
  }, [enabled, enableHelp, shortcuts, shouldIgnoreKeyboard, matchesShortcut, onHelpToggle]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  const toggleHelp = useCallback(() => {
    isHelpVisible.current = !isHelpVisible.current;
    if (onHelpToggle) {
      onHelpToggle(isHelpVisible.current);
    }
  }, [onHelpToggle]);

  return {
    isHelpVisible: isHelpVisible.current,
    toggleHelp,
    shortcutsList: shortcuts.map(s => ({
      ...s,
      description: `${formatShortcut(s)} - ${s.description}`
    }))
  };
}

/**
 * Common keyboard shortcuts for data navigation
 */
export const createDataNavigationShortcuts = (
  callbacks: {
    onSearch?: () => void;
    onFilter?: () => void;
    onRefresh?: () => void;
    onExport?: () => void;
    onNextPage?: () => void;
    onPrevPage?: () => void;
    onFirstPage?: () => void;
    onLastPage?: () => void;
    onToggleView?: () => void;
    onEscape?: () => void;
    onSelectAll?: () => void;
    onDelete?: () => void;
  }
): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (callbacks.onSearch) {
    shortcuts.push({
      key: 'f',
      ctrl: true,
      description: 'Focus search',
      handler: callbacks.onSearch,
      preventDefault: true
    });
    
    shortcuts.push({
      key: '/',
      description: 'Quick search',
      handler: callbacks.onSearch,
      preventDefault: true
    });
  }

  if (callbacks.onFilter) {
    shortcuts.push({
      key: 'f',
      alt: true,
      description: 'Toggle filters',
      handler: callbacks.onFilter,
      preventDefault: true
    });
  }

  if (callbacks.onRefresh) {
    shortcuts.push({
      key: 'r',
      ctrl: true,
      description: 'Refresh data',
      handler: callbacks.onRefresh,
      preventDefault: true
    });
    
    shortcuts.push({
      key: 'F5',
      description: 'Refresh data',
      handler: callbacks.onRefresh,
      preventDefault: false
    });
  }

  if (callbacks.onExport) {
    shortcuts.push({
      key: 'e',
      ctrl: true,
      description: 'Export data',
      handler: callbacks.onExport,
      preventDefault: true
    });
  }

  if (callbacks.onNextPage) {
    shortcuts.push({
      key: 'ArrowRight',
      description: 'Next page',
      handler: callbacks.onNextPage
    });
    
    shortcuts.push({
      key: 'n',
      description: 'Next page',
      handler: callbacks.onNextPage
    });
  }

  if (callbacks.onPrevPage) {
    shortcuts.push({
      key: 'ArrowLeft',
      description: 'Previous page',
      handler: callbacks.onPrevPage
    });
    
    shortcuts.push({
      key: 'p',
      description: 'Previous page',
      handler: callbacks.onPrevPage
    });
  }

  if (callbacks.onFirstPage) {
    shortcuts.push({
      key: 'Home',
      description: 'First page',
      handler: callbacks.onFirstPage
    });
  }

  if (callbacks.onLastPage) {
    shortcuts.push({
      key: 'End',
      description: 'Last page',
      handler: callbacks.onLastPage
    });
  }

  if (callbacks.onToggleView) {
    shortcuts.push({
      key: 'v',
      alt: true,
      description: 'Toggle view',
      handler: callbacks.onToggleView,
      preventDefault: true
    });
  }

  if (callbacks.onEscape) {
    shortcuts.push({
      key: 'Escape',
      description: 'Close/Cancel',
      handler: callbacks.onEscape,
      global: true
    });
  }

  if (callbacks.onSelectAll) {
    shortcuts.push({
      key: 'a',
      ctrl: true,
      description: 'Select all',
      handler: callbacks.onSelectAll,
      preventDefault: true
    });
  }

  if (callbacks.onDelete) {
    shortcuts.push({
      key: 'Delete',
      description: 'Delete selected',
      handler: callbacks.onDelete
    });
  }

  return shortcuts;
};

/**
 * Hook for single key navigation (vim-style)
 */
export function useVimNavigation(
  callbacks: {
    onUp?: () => void;
    onDown?: () => void;
    onLeft?: () => void;
    onRight?: () => void;
    onSelect?: () => void;
    onBack?: () => void;
  },
  enabled: boolean = true
): void {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Skip if in input field
    const active = document.activeElement;
    if (active) {
      const tagName = active.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }
    }
    
    switch (event.key.toLowerCase()) {
      case 'k':
      case 'arrowup':
        callbacks.onUp?.();
        event.preventDefault();
        break;
      case 'j':
      case 'arrowdown':
        callbacks.onDown?.();
        event.preventDefault();
        break;
      case 'h':
      case 'arrowleft':
        callbacks.onLeft?.();
        event.preventDefault();
        break;
      case 'l':
      case 'arrowright':
        callbacks.onRight?.();
        event.preventDefault();
        break;
      case 'enter':
      case ' ':
        callbacks.onSelect?.();
        event.preventDefault();
        break;
      case 'escape':
      case 'backspace':
        callbacks.onBack?.();
        event.preventDefault();
        break;
    }
  }, [enabled, callbacks]);

  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}