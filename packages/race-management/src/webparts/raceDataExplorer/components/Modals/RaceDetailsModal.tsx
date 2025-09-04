import * as React from 'react';
import { IRace } from '../../../../models/IRaceData';
import { Modal, IconButton } from '@fluentui/react';
import { StatusBadge } from '../../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import styles from './Modals.module.scss';
const logoUrl = require('../../../../assets/images/siteicon.png');

interface RaceDetailsModalProps {
  race: IRace | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RaceDetailsModal: React.FC<RaceDetailsModalProps> = ({
  race,
  isOpen,
  onClose
}) => {
  if (!race) return null;

  const formatTime = (dateString: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '-';
    return `$${amount.toLocaleString('en-AU')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      isBlocking={false}
      containerClassName={styles.modalContainer}
    >
      <div className={styles.modalHeader}>
        <h2>
          <img src={logoUrl} alt="GRNSW" className={styles.headerLogo} />
          Race Details - Race {race.cr616_racenumber}
        </h2>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          ariaLabel="Close"
          onClick={onClose}
          className={styles.closeButton}
        />
      </div>
      
      <div className={styles.modalBody}>
        <div className={styles.detailSection}>
          <h3>Race Information</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Race Title:</span>
              <span className={styles.value}>{race.cr616_racetitle || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Grade:</span>
              <span className={styles.value}>{race.cr616_racegrading || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Distance:</span>
              <span className={styles.value}>{race.cr616_distance ? `${race.cr616_distance}m` : '-'}</span>
            </div>
            {formatTime(race.cr616_starttime) && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Start Time:</span>
                <span className={styles.value}>{formatTime(race.cr616_starttime)}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.label}>Contestants:</span>
              <span className={styles.value}>{race.cr616_numberofcontestants || 0}</span>
            </div>
            {race.cr616_status && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Status:</span>
                <StatusBadge 
                  status={race.cr616_status} 
                  variant={race.cr616_status === 'Completed' ? 'success' : 'neutral'} 
                  size="small" 
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3>Prize Money</h3>
          <div className={styles.prizeGrid}>
            <div className={styles.prizeItem}>
              <span className={`${styles.placement} ${styles.first}`}>1<sup>st</sup></span>
              <span className={styles.amount}>{formatCurrency(race.cr616_prize1 || 0)}</span>
            </div>
            <div className={styles.prizeItem}>
              <span className={`${styles.placement} ${styles.second}`}>2<sup>nd</sup></span>
              <span className={styles.amount}>{formatCurrency(race.cr616_prize2 || 0)}</span>
            </div>
            <div className={styles.prizeItem}>
              <span className={`${styles.placement} ${styles.third}`}>3<sup>rd</sup></span>
              <span className={styles.amount}>{formatCurrency(race.cr616_prize3 || 0)}</span>
            </div>
            <div className={styles.prizeItem}>
              <span className={`${styles.placement} ${styles.fourth}`}>4<sup>th</sup></span>
              <span className={styles.amount}>{formatCurrency(race.cr616_prize4 || 0)}</span>
            </div>
          </div>
        </div>

        {(race.cr616_firstsectionaltime || race.cr616_secondsectiontime) && (
          <div className={styles.detailSection}>
            <h3>Sectional Times</h3>
            <div className={styles.detailGrid}>
              {race.cr616_firstsectionaltime && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>First Section:</span>
                  <span className={styles.value}>{race.cr616_firstsectionaltime}s</span>
                </div>
              )}
              {race.cr616_secondsectiontime && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Second Section:</span>
                  <span className={styles.value}>{race.cr616_secondsectiontime}s</span>
                </div>
              )}
            </div>
          </div>
        )}

        {race.cr616_stewardracecomment && (
          <div className={styles.detailSection}>
            <h3>Steward's Race Comment</h3>
            <p className={styles.comments}>{race.cr616_stewardracecomment}</p>
          </div>
        )}

        {race.cr616_racesectionaloverview && (
          <div className={styles.detailSection}>
            <h3>Sectional Overview</h3>
            <p className={styles.comments}>{race.cr616_racesectionaloverview}</p>
          </div>
        )}

        <div className={styles.systemInfoSection}>
          <h3>System Information</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Race ID:</span>
              <span className={styles.value}>{race.cr616_racesid}</span>
            </div>
            {race.cr616_sfraceid && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Salesforce ID:</span>
                <span className={styles.value}>{race.cr616_sfraceid}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.modalFooter}>
        <button onClick={onClose} className={styles.primaryButton}>
          Close
        </button>
      </div>
    </Modal>
  );
};