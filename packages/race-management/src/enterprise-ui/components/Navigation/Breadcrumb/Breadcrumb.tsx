import * as React from 'react';
import styles from './Breadcrumb.module.scss';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  maxItems?: number;
  theme?: 'neutral' | 'meeting' | 'race' | 'contestant';
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = '›',
  className = '',
  maxItems,
  theme = 'neutral'
}) => {
  const displayItems = React.useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return items;
    }
    
    // Show first item, ellipsis, and last n-1 items
    const firstItem = items[0];
    const lastItems = items.slice(-(maxItems - 1));
    
    return [
      firstItem,
      { label: '...', onClick: undefined, href: undefined },
      ...lastItems
    ];
  }, [items, maxItems]);
  
  const handleClick = (e: React.MouseEvent, item: BreadcrumbItem) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
  };
  
  return (
    <nav 
      className={`${styles.breadcrumb} ${styles[`theme-${theme}`]} ${className}`}
      aria-label="Breadcrumb navigation"
    >
      <ol className={styles.list}>
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';
          
          return (
            <li key={index} className={styles.item}>
              {!isLast && !isEllipsis ? (
                <>
                  {item.href ? (
                    <a 
                      href={item.href} 
                      className={styles.link}
                      onClick={(e) => handleClick(e, item)}
                    >
                      {item.icon && <span className={styles.icon}>{item.icon}</span>}
                      {item.label}
                    </a>
                  ) : (
                    <button 
                      className={styles.link}
                      onClick={() => item.onClick?.()}
                    >
                      {item.icon && <span className={styles.icon}>{item.icon}</span>}
                      {item.label}
                    </button>
                  )}
                  <span className={styles.separator} aria-hidden="true">
                    {separator}
                  </span>
                </>
              ) : isEllipsis ? (
                <>
                  <span className={styles.ellipsis}>{item.label}</span>
                  <span className={styles.separator} aria-hidden="true">
                    {separator}
                  </span>
                </>
              ) : (
                <span className={styles.current} aria-current="page">
                  {item.icon && <span className={styles.icon}>{item.icon}</span>}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};