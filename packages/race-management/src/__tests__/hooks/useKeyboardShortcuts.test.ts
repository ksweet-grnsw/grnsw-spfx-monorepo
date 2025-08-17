import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, createDataNavigationShortcuts, useVimNavigation } from '../../hooks/useKeyboardShortcuts';
import { fireEvent } from '@testing-library/dom';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useKeyboardShortcuts', () => {
    it('should register and trigger keyboard shortcuts', () => {
      const callback = jest.fn();
      const shortcuts = [
        {
          key: 'a',
          ctrl: false,
          shift: false,
          alt: false,
          description: 'Test shortcut',
          callback
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Trigger the shortcut
      fireEvent.keyDown(document, { key: 'a' });

      expect(callback).toHaveBeenCalled();
    });

    it('should handle modifier keys correctly', () => {
      const callback = jest.fn();
      const shortcuts = [
        {
          key: 's',
          ctrl: true,
          shift: false,
          alt: false,
          description: 'Save',
          callback
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Without Ctrl - should not trigger
      fireEvent.keyDown(document, { key: 's' });
      expect(callback).not.toHaveBeenCalled();

      // With Ctrl - should trigger
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple shortcuts', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const shortcuts = [
        {
          key: 'a',
          ctrl: false,
          shift: false,
          alt: false,
          description: 'Action A',
          callback: callback1
        },
        {
          key: 'b',
          ctrl: false,
          shift: false,
          alt: false,
          description: 'Action B',
          callback: callback2
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      fireEvent.keyDown(document, { key: 'a' });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      fireEvent.keyDown(document, { key: 'b' });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should prevent default when preventDefault is true', () => {
      const callback = jest.fn();
      const shortcuts = [
        {
          key: 'Enter',
          ctrl: false,
          shift: false,
          alt: false,
          description: 'Submit',
          callback,
          preventDefault: true
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should not trigger when disabled', () => {
      const callback = jest.fn();
      const shortcuts = [
        {
          key: 'a',
          ctrl: false,
          shift: false,
          alt: false,
          description: 'Test',
          callback
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts, false));

      fireEvent.keyDown(document, { key: 'a' });
      expect(callback).not.toHaveBeenCalled();
    });

    it('should cleanup on unmount', () => {
      const callback = jest.fn();
      const shortcuts = [
        {
          key: 'a',
          ctrl: false,
          shift: false,
          alt: false,
          description: 'Test',
          callback
        }
      ];

      const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));
      
      unmount();

      // After unmount, shortcut should not trigger
      fireEvent.keyDown(document, { key: 'a' });
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('createDataNavigationShortcuts', () => {
    it('should create navigation shortcuts', () => {
      const onFirst = jest.fn();
      const onPrevious = jest.fn();
      const onNext = jest.fn();
      const onLast = jest.fn();
      const onRefresh = jest.fn();

      const shortcuts = createDataNavigationShortcuts({
        onFirst,
        onPrevious,
        onNext,
        onLast,
        onRefresh
      });

      expect(shortcuts).toHaveLength(5);
      
      // Test each shortcut
      const homeShortcut = shortcuts.find(s => s.key === 'Home');
      expect(homeShortcut).toBeDefined();
      homeShortcut?.callback();
      expect(onFirst).toHaveBeenCalled();

      const leftShortcut = shortcuts.find(s => s.key === 'ArrowLeft');
      expect(leftShortcut).toBeDefined();
      leftShortcut?.callback();
      expect(onPrevious).toHaveBeenCalled();
    });

    it('should handle optional callbacks', () => {
      const shortcuts = createDataNavigationShortcuts({});
      
      expect(shortcuts).toHaveLength(5);
      
      // Should not throw when callbacks are undefined
      shortcuts.forEach(shortcut => {
        expect(() => shortcut.callback()).not.toThrow();
      });
    });
  });

  describe('useVimNavigation', () => {
    it('should handle vim navigation keys', () => {
      const onNavigate = jest.fn();
      
      renderHook(() => useVimNavigation({
        onNavigate,
        isEnabled: true
      }));

      // Test vim keys
      fireEvent.keyDown(document, { key: 'j' });
      expect(onNavigate).toHaveBeenCalledWith('down');

      fireEvent.keyDown(document, { key: 'k' });
      expect(onNavigate).toHaveBeenCalledWith('up');

      fireEvent.keyDown(document, { key: 'h' });
      expect(onNavigate).toHaveBeenCalledWith('left');

      fireEvent.keyDown(document, { key: 'l' });
      expect(onNavigate).toHaveBeenCalledWith('right');
    });

    it('should handle page navigation', () => {
      const onPageUp = jest.fn();
      const onPageDown = jest.fn();
      
      renderHook(() => useVimNavigation({
        onPageUp,
        onPageDown,
        isEnabled: true
      }));

      fireEvent.keyDown(document, { key: 'u', ctrlKey: true });
      expect(onPageUp).toHaveBeenCalled();

      fireEvent.keyDown(document, { key: 'd', ctrlKey: true });
      expect(onPageDown).toHaveBeenCalled();
    });

    it('should handle go-to navigation', () => {
      const onGoToTop = jest.fn();
      const onGoToBottom = jest.fn();
      
      renderHook(() => useVimNavigation({
        onGoToTop,
        onGoToBottom,
        isEnabled: true
      }));

      // gg - go to top
      fireEvent.keyDown(document, { key: 'g' });
      fireEvent.keyDown(document, { key: 'g' });
      expect(onGoToTop).toHaveBeenCalled();

      // G - go to bottom
      fireEvent.keyDown(document, { key: 'G', shiftKey: true });
      expect(onGoToBottom).toHaveBeenCalled();
    });

    it('should not trigger when disabled', () => {
      const onNavigate = jest.fn();
      
      renderHook(() => useVimNavigation({
        onNavigate,
        isEnabled: false
      }));

      fireEvent.keyDown(document, { key: 'j' });
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });
});