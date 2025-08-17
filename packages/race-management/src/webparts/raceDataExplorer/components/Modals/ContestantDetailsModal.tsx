import * as React from 'react';
import { IContestant } from '../../../../models/IRaceData';
import { Modal, IconButton } from '@fluentui/react';
import { StatusBadge } from '../../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import { renderRugNumber, renderPlacement } from '../../../../utils/tableConfig/columnHelpers';
import styles from './Modals.module.scss';

interface ContestantDetailsModalProps {
  contestant: IContestant | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContestantDetailsModal: React.FC<ContestantDetailsModalProps> = ({
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
        <h2>Contestant Details</h2>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          ariaLabel="Close"
          onClick={onClose}
          className={styles.closeButton}
        />
      </div>
      
      <div className={styles.modalBody}>
        <div className={styles.detailSection}>
          <h3>Greyhound Information</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Rug Number:</span>
              <span className={styles.value}>{renderRugNumber(contestant.cr616_rugnumber)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Name:</span>
              <span className={styles.value}>{contestant.cr616_greyhoundname}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Grade:</span>
              <span className={styles.value}>{contestant.cr616_doggrade || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Weight:</span>
              <span className={styles.value}>
                {contestant.cr616_weight ? `${contestant.cr616_weight}kg` : '-'}
              </span>
            </div>
            {contestant.cr616_leftearbrand && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Ear Brand:</span>
                <span className={styles.value}>{contestant.cr616_leftearbrand}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3>Connections</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Owner:</span>
              <span className={styles.value}>{contestant.cr616_ownername || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Trainer:</span>
              <span className={styles.value}>{contestant.cr616_trainername || '-'}</span>
            </div>
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3>Race Performance</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Placement:</span>
              <span className={styles.value}>
                {contestant.cr616_placement ? renderPlacement(contestant.cr616_placement) : '-'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Margin:</span>
              <span className={styles.value}>
                {contestant.cr616_margin ? `${contestant.cr616_margin}L` : '-'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Finish Time:</span>
              <span className={styles.value}>
                {contestant.cr616_finishtime ? `${contestant.cr616_finishtime}s` : '-'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Status:</span>
              <StatusBadge 
                status={contestant.cr616_status || 'Unknown'} 
                variant={contestant.cr616_status === 'Runner' ? 'success' : 
                        contestant.cr616_status === 'Scratched' ? 'error' : 'neutral'} 
                size="small" 
              />
            </div>
            {contestant.cr616_prizemoney && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Prize Money:</span>
                <span className={styles.value}>
                  ${contestant.cr616_prizemoney.toLocaleString('en-AU')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.detailSection}>
          <h3>Racing History</h3>
          <div className={styles.detailGrid}>
            {contestant.cr616_dayssincelastrace !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Days Since Last Race:</span>
                <span className={styles.value}>{contestant.cr616_dayssincelastrace}</span>
              </div>
            )}
            {contestant.cr616_totalnumberofwinds !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Career Wins:</span>
                <span className={styles.value}>{contestant.cr616_totalnumberofwinds}</span>
              </div>
            )}
            {contestant.cr616_racewithin2days && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Raced Within 2 Days:</span>
                <StatusBadge status="Yes" variant="warning" size="small" />
              </div>
            )}
            {contestant.cr616_failedtofinish && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Failed to Finish:</span>
                <StatusBadge status="DNF" variant="error" size="small" />
              </div>
            )}
          </div>
        </div>

        <div className={styles.detailSection}>
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
            <div className={styles.detailRow}>
              <span className={styles.label}>Race Number:</span>
              <span className={styles.value}>{contestant.cr616_racenumber || '-'}</span>
            </div>
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