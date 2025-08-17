import * as React from 'react';
import { Modal, IconButton } from '@fluentui/react';
import styles from './KeyboardShortcutsHelp.module.scss';
import type { KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

export interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  theme?: 'neutral' | 'meeting' | 'race' | 'contestant';
}

/**
 * Modal component displaying keyboard shortcuts help
 * Follows SOLID principles with single responsibility
 */
export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
  shortcuts,
  theme = 'neutral'
}) => {
  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {
      'Navigation': [],
      'Search & Filter': [],
      'Data Operations': [],
      'View Controls': [],
      'Other': []
    };

    shortcuts.forEach(shortcut => {
      let category = 'Other';
      
      // Categorize based on key or description
      if (shortcut.key.includes('Arrow') || 
          shortcut.key === 'Home' || 
          shortcut.key === 'End' ||
          shortcut.description.toLowerCase().includes('page') ||
          shortcut.description.toLowerCase().includes('navigate')) {
        category = 'Navigation';
      } else if (shortcut.description.toLowerCase().includes('search') || 
                 shortcut.description.toLowerCase().includes('filter')) {
        category = 'Search & Filter';
      } else if (shortcut.description.toLowerCase().includes('refresh') || 
                 shortcut.description.toLowerCase().includes('export') ||
                 shortcut.description.toLowerCase().includes('select') ||
                 shortcut.description.toLowerCase().includes('delete')) {
        category = 'Data Operations';
      } else if (shortcut.description.toLowerCase().includes('view') || 
                 shortcut.description.toLowerCase().includes('toggle')) {
        category = 'View Controls';
      }
      
      groups[category].push(shortcut);
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [shortcuts]);

  // Format shortcut key combination for display
  const formatKeys = (shortcut: KeyboardShortcut): string => {
    const keys: string[] = [];
    
    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.alt) keys.push('Alt');
    if (shortcut.shift) keys.push('Shift');
    if (shortcut.meta) keys.push('⌘');
    
    // Format the main key
    let mainKey = shortcut.key;
    if (mainKey === ' ') mainKey = 'Space';
    else if (mainKey === 'ArrowUp') mainKey = '↑';
    else if (mainKey === 'ArrowDown') mainKey = '↓';
    else if (mainKey === 'ArrowLeft') mainKey = '←';
    else if (mainKey === 'ArrowRight') mainKey = '→';
    else if (mainKey.length === 1) mainKey = mainKey.toUpperCase();
    
    keys.push(mainKey);
    
    return keys.join(' + ');
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      isBlocking={false}
      containerClassName={`${styles.modalContainer} ${styles[`theme-${theme}`]}`}
    >
      <div className={styles.modalHeader}>
        <h2>Keyboard Shortcuts</h2>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          ariaLabel="Close"
          onClick={onClose}
          className={styles.closeButton}
        />
      </div>

      <div className={styles.modalContent}>
        <div className={styles.helpTip}>
          <span className={styles.tipIcon}>💡</span>
          <span>Press <kbd>?</kbd> anytime to toggle this help</span>
        </div>

        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          <div key={category} className={styles.shortcutGroup}>
            <h3 className={styles.groupTitle}>{category}</h3>
            <div className={styles.shortcutList}>
              {categoryShortcuts.map((shortcut, index) => (
                <div key={index} className={styles.shortcutItem}>
                  <div className={styles.keyCombination}>
                    {formatKeys(shortcut).split(' + ').map((key, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className={styles.plus}>+</span>}
                        <kbd className={styles.key}>{key}</kbd>
                      </React.Fragment>
                    ))}
                  </div>
                  <span className={styles.description}>
                    {shortcut.description}
                    {shortcut.global && (
                      <span className={styles.globalBadge} title="Works even in input fields">
                        Global
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className={styles.vimMode}>
          <h3 className={styles.groupTitle}>Vim Navigation Mode</h3>
          <div className={styles.vimGrid}>
            <div className={styles.vimKey}>
              <kbd>h</kbd>
              <span>Left</span>
            </div>
            <div className={styles.vimKey}>
              <kbd>j</kbd>
              <span>Down</span>
            </div>
            <div className={styles.vimKey}>
              <kbd>k</kbd>
              <span>Up</span>
            </div>
            <div className={styles.vimKey}>
              <kbd>l</kbd>
              <span>Right</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.modalFooter}>
        <button onClick={onClose} className={styles.primaryButton}>
          Got it!
        </button>
      </div>
    </Modal>
  );
};

/**
 * Floating help indicator component
 */
export const KeyboardShortcutsIndicator: React.FC<{
  onClick: () => void;
  visible?: boolean;
}> = ({ onClick, visible = true }) => {
  if (!visible) return null;

  return (
    <button
      className={styles.floatingIndicator}
      onClick={onClick}
      aria-label="Keyboard shortcuts help"
      title="Press ? for keyboard shortcuts"
    >
      <span className={styles.keyIcon}>⌨</span>
      <span className={styles.questionMark}>?</span>
    </button>
  );
};