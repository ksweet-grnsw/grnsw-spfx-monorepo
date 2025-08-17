import * as React from 'react';
import styles from './VirtualScrollNotification.module.scss';

interface IVirtualScrollNotificationProps {
  itemCount: number;
  threshold: number;
  dataType: string;
}

export const VirtualScrollNotification: React.FC<IVirtualScrollNotificationProps> = ({
  itemCount,
  threshold,
  dataType
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false);
  
  React.useEffect(() => {
    setIsDismissed(false);
  }, [itemCount, dataType]);
  
  if (itemCount <= threshold || isDismissed) {
    return null;
  }
  
  return (
    <div className={styles.notification}>
      <div className={styles.content}>
        <div className={styles.icon}>⚡</div>
        <div className={styles.message}>
          <div className={styles.title}>Virtual Scrolling Activated</div>
          <div className={styles.description}>
            Displaying {itemCount.toLocaleString()} {dataType}. Virtual scrolling is enabled for optimal performance.
          </div>
        </div>
        <button 
          className={styles.dismissButton}
          onClick={() => setIsDismissed(true)}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} />
      </div>
    </div>
  );
};