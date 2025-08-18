import * as React from 'react';
import { IContestant, IHealthCheck, IGreyhound } from '../../../../models/IRaceData';
import { Modal, IconButton } from '@fluentui/react';
import { StatusBadge } from '../../../../enterprise-ui/components/DataDisplay/StatusIndicator/StatusBadge';
import { renderRugNumber, renderPlacement } from '../../../../utils/tableConfig/columnHelpers';
import { InjuryIndicator } from '../../../../components/InjuryIndicator';
import styles from './Modals.module.scss';
const logoUrl = require('../../../../assets/images/siteicon.png');

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
  const [healthCheck, setHealthCheck] = React.useState<IHealthCheck | null>(null);
  const [greyhound, setGreyhound] = React.useState<IGreyhound | null>(null);
  const [loadingHealthData, setLoadingHealthData] = React.useState(false);

  // Import data service
  const { RaceDataService } = require('../../../../services/RaceDataService');
  const dataService = new RaceDataService();

  // Load health check data when contestant changes
  React.useEffect(() => {
    if (!contestant || !isOpen) {
      setHealthCheck(null);
      setGreyhound(null);
      return;
    }

    const loadHealthData = async () => {
      setLoadingHealthData(true);
      try {
        // Get greyhound information first
        const greyhoundData = await dataService.getGreyhoundByName(contestant.cr616_greyhoundname);
        setGreyhound(greyhoundData);
        
        if (greyhoundData) {
          // Get latest health check for this greyhound
          const latestHealthCheck = await dataService.getLatestHealthCheckForGreyhound(greyhoundData.cra5e_greyhoundid);
          setHealthCheck(latestHealthCheck);
        }
      } catch (error) {
        console.warn('Could not load health data for contestant:', contestant.cr616_greyhoundname, error);
      } finally {
        setLoadingHealthData(false);
      }
    };

    loadHealthData();
  }, [contestant, isOpen]);

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
          Contestant Details{contestant.cr616_racenumber ? ` - Race ${contestant.cr616_racenumber}` : ''}
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

        {/* Health Check Information */}
        <div className={styles.detailSection}>
          <h3>
            Health Information
            {loadingHealthData && <span className={styles.loading}> (Loading...)</span>}
          </h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Injury Status:</span>
              <span className={styles.value}>
                <InjuryIndicator 
                  hasInjury={(contestant as any).hasInjuries || false} 
                  size="medium" 
                  inline={true}
                  tooltip="Current injury status"
                />
                {(contestant as any).hasInjuries ? ' Has recent injury' : ' No recent injuries'}
              </span>
            </div>
            {healthCheck && (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Last Health Check:</span>
                  <span className={styles.value}>
                    {new Date(healthCheck.cra5e_datechecked).toLocaleDateString('en-AU')}
                  </span>
                </div>
                {healthCheck.cra5e_injuryclassification && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Injury Classification:</span>
                    <StatusBadge 
                      status={healthCheck.cra5e_injuryclassification} 
                      variant={
                        healthCheck.cra5e_injuryclassification.includes('Cat A') || healthCheck.cra5e_injuryclassification.includes('Cat B') ? 'error' :
                        healthCheck.cra5e_injuryclassification.includes('Cat C') ? 'warning' : 'info'
                      } 
                      size="small" 
                    />
                  </div>
                )}
                {healthCheck.cra5e_trackname && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Health Check Track:</span>
                    <span className={styles.value}>{healthCheck.cra5e_trackname}</span>
                  </div>
                )}
                {healthCheck.cra5e_standdowndays && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Stand Down Days:</span>
                    <span className={styles.value}>{healthCheck.cra5e_standdowndays}</span>
                  </div>
                )}
                {healthCheck.cra5e_standdowndaysenddate && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Stand Down Until:</span>
                    <span className={styles.value}>
                      {new Date(healthCheck.cra5e_standdowndaysenddate).toLocaleDateString('en-AU')}
                    </span>
                  </div>
                )}
                {healthCheck.cra5e_followupinformation && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Follow-up Info:</span>
                    <span className={styles.value}>{healthCheck.cra5e_followupinformation}</span>
                  </div>
                )}
              </>
            )}
            {greyhound && !healthCheck && !loadingHealthData && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Health Check Status:</span>
                <span className={styles.value}>No recent health checks found</span>
              </div>
            )}
            {!greyhound && !loadingHealthData && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Health Check Status:</span>
                <span className={styles.value}>Greyhound not found in health system</span>
              </div>
            )}
          </div>
        </div>

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