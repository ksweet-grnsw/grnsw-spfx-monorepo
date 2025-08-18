import * as React from 'react';
import { IContestant } from '../../../../models/IRaceData';
import { Modal, IconButton } from '@fluentui/react';
import { StatusBadge } from '../../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import styles from './Modals.module.scss';
const logoUrl = require('../../../../assets/images/siteicon.png');

interface GreyhoundDetailsModalProps {
  contestant: IContestant | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GreyhoundDetailsModal: React.FC<GreyhoundDetailsModalProps> = ({
  contestant,
  isOpen,
  onClose
}) => {
  if (!contestant) return null;

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
          Greyhound Profile
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
          <h3>{contestant.cr616_greyhoundname}</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Owner:</span>
              <span className={styles.value}>{contestant.cr616_ownername || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Trainer:</span>
              <span className={styles.value}>{contestant.cr616_trainername || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Grade:</span>
              <span className={styles.value}>{contestant.cr616_doggrade || '-'}</span>
            </div>
            {contestant.cr616_weight && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Weight:</span>
                <span className={styles.value}>{contestant.cr616_weight}kg</span>
              </div>
            )}
            {contestant.cr616_leftearbrand && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Ear Brand:</span>
                <span className={styles.value}>{contestant.cr616_leftearbrand}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3>Performance Statistics</h3>
          <div className={styles.detailGrid}>
            {contestant.cr616_totalnumberofwinds !== null && contestant.cr616_totalnumberofwinds !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Total Wins:</span>
                <span className={styles.value}>{contestant.cr616_totalnumberofwinds}</span>
              </div>
            )}
            {contestant.cr616_dayssincelastrace !== null && contestant.cr616_dayssincelastrace !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Days Since Last Race:</span>
                <span className={styles.value}>{contestant.cr616_dayssincelastrace}</span>
              </div>
            )}
            {contestant.cr616_racewithin2days !== null && contestant.cr616_racewithin2days !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Raced Within 2 Days:</span>
                <span className={styles.value}>{contestant.cr616_racewithin2days ? 'Yes' : 'No'}</span>
              </div>
            )}
            {contestant.cr616_failedtofinish !== null && contestant.cr616_failedtofinish !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Failed to Finish:</span>
                <span className={styles.value}>{contestant.cr616_failedtofinish ? 'Yes' : 'No'}</span>
              </div>
            )}
          </div>
        </div>

        {contestant.cr616_finishtime && (
          <div className={styles.detailSection}>
            <h3>Last Race Performance</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Finish Time:</span>
                <span className={styles.value}>{contestant.cr616_finishtime}s</span>
              </div>
              {contestant.cr616_placement && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Placement:</span>
                  <span className={styles.value}>{contestant.cr616_placement}</span>
                </div>
              )}
              {contestant.cr616_margin !== null && contestant.cr616_margin !== undefined && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Margin:</span>
                  <span className={styles.value}>{contestant.cr616_margin}L</span>
                </div>
              )}
              {contestant.cr616_prizemoney !== null && contestant.cr616_prizemoney !== undefined && (
                <div className={styles.detailRow}>
                  <span className={styles.label}>Prize Money:</span>
                  <span className={styles.value}>${contestant.cr616_prizemoney.toLocaleString('en-AU')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.systemInfoSection}>
          <h3>System Information</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Contestant ID:</span>
              <span className={styles.value}>{contestant.cr616_contestantsid}</span>
            </div>
            {contestant.cr616_sfcontestantid && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Salesforce ID:</span>
                <span className={styles.value}>{contestant.cr616_sfcontestantid}</span>
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