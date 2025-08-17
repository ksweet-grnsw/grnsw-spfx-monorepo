import { useState, useCallback } from 'react';

/**
 * Generic modal management hook to eliminate duplicate modal state logic
 * Handles open/close state and selected item management
 */
export function useModalManager<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  
  const open = useCallback((item: T) => {
    setSelectedItem(item);
    setIsOpen(true);
  }, []);
  
  const close = useCallback(() => {
    setIsOpen(false);
    // Clear selected item after animation completes
    setTimeout(() => setSelectedItem(null), 300);
  }, []);
  
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  return {
    isOpen,
    selectedItem,
    open,
    close,
    toggle,
    setSelectedItem
  };
}

/**
 * Multi-modal manager for managing multiple modals in a single component
 * Useful when you have different modal types (meeting, race, contestant, etc.)
 */
export function useMultiModalManager() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, any>>({});
  
  const openModal = useCallback((modalType: string, item?: any) => {
    setActiveModal(modalType);
    if (item) {
      setSelectedItems(prev => ({
        ...prev,
        [modalType]: item
      }));
    }
  }, []);
  
  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);
  
  const isModalOpen = useCallback((modalType: string) => {
    return activeModal === modalType;
  }, [activeModal]);
  
  const getSelectedItem = useCallback((modalType: string) => {
    return selectedItems[modalType] || null;
  }, [selectedItems]);
  
  const clearSelectedItem = useCallback((modalType: string) => {
    setSelectedItems(prev => {
      const newItems = { ...prev };
      delete newItems[modalType];
      return newItems;
    });
  }, []);
  
  return {
    activeModal,
    openModal,
    closeModal,
    isModalOpen,
    getSelectedItem,
    clearSelectedItem,
    selectedItems
  };
}