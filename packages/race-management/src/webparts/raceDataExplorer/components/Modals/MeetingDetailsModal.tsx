import * as React from 'react';
import { IMeeting } from '../../../../models/IRaceData';
import { Modal, IconButton } from '@fluentui/react';
import { StatusBadge } from '../../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import styles from './Modals.module.scss';

interface MeetingDetailsModalProps {
  meeting: IMeeting | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
  meeting,
  isOpen,
  onClose
}) => {
  if (!meeting) return null;

  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      isBlocking={false}
      containerClassName={styles.modalContainer}
    >
      <div className={styles.modalHeader}>
        <h2>Meeting Details</h2>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          ariaLabel="Close"
          onClick={onClose}
          className={styles.closeButton}
        />
      </div>
      
      <div className={styles.modalBody}>
        <div className={styles.detailSection}>
          <h3>General Information</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Track:</span>
              <span className={styles.value}>{meeting.cr4cc_trackname}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Date:</span>
              <span className={styles.value}>{formatDate(meeting.cr4cc_meetingdate)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Authority:</span>
              <StatusBadge status={meeting.cr4cc_authority} variant="info" size="small" />
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Timeslot:</span>
              <StatusBadge status={meeting.cr4cc_timeslot} variant="neutral" size="small" />
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Type:</span>
              <span className={styles.value}>{meeting.cr4cc_type || 'Standard'}</span>
            </div>
            {meeting.cr4cc_cancelled && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Status:</span>
                <StatusBadge status="Cancelled" variant="error" size="small" />
              </div>
            )}
          </div>
        </div>

        {meeting.cr616_weather && (
          <div className={styles.detailSection}>
            <h3>Weather Conditions</h3>
            <p className={styles.weatherInfo}>{meeting.cr616_weather}</p>
          </div>
        )}

        {meeting.cr616_trackcondition && (
          <div className={styles.detailSection}>
            <h3>Track Condition</h3>
            <p className={styles.trackCondition}>{meeting.cr616_trackcondition}</p>
          </div>
        )}

        {meeting.cr616_stewardcomment && (
          <div className={styles.detailSection}>
            <h3>Steward's Comments</h3>
            <p className={styles.comments}>{meeting.cr616_stewardcomment}</p>
          </div>
        )}

        <div className={styles.detailSection}>
          <h3>System Information</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Meeting ID:</span>
              <span className={styles.value}>{meeting.cr4cc_racemeetingid}</span>
            </div>
            {meeting.cr4cc_salesforceid && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Salesforce ID:</span>
                <span className={styles.value}>{meeting.cr4cc_salesforceid}</span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.label}>Last Modified:</span>
              <span className={styles.value}>
                {new Date(meeting.modifiedon).toLocaleString('en-AU')}
              </span>
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