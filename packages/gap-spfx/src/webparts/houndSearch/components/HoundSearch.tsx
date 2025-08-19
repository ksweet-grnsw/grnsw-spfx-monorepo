import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  TextField, 
  Dropdown, 
  IDropdownOption, 
  Toggle, 
  Spinner, 
  SpinnerSize,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  DefaultButton,
  Stack,
  StackItem,
  Panel,
  PanelType,
  Label
} from '@fluentui/react';
import { HoundService } from '../../../services/HoundService';
import { IHound, IHoundFilters, IHoundSearchResults } from '../../../models/IHound';
import { DataGrid } from '../../../enterprise-ui/components/DataDisplay/DataGrid/DataGrid';
import { DataGridColumn } from '../../../enterprise-ui/components/DataDisplay/DataGrid/DataGrid.types';
import styles from './HoundSearch.module.scss';

export interface IHoundSearchProps {
  title: string;
  pageSize: number;
  showOnlyAvailable: boolean;
  enableAdvancedFilters: boolean;
  context: WebPartContext;
  isDarkTheme: boolean;
  hasTeamsContext: boolean;
}

/**
 * Main Hound Search Component
 * Implements search and filter functionality for GAP hounds
 */
const HoundSearch: React.FC<IHoundSearchProps> = (props) => {
  // State management
  const [searchResults, setSearchResults] = useState<IHoundSearchResults>({ 
    hounds: [], 
    totalCount: 0, 
    hasMore: false 
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedHound, setSelectedHound] = useState<IHound | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  
  // Filter state
  const [searchText, setSearchText] = useState<string>('');
  const [selectedSex, setSelectedSex] = useState<string>('');
  const [showDesexed, setShowDesexed] = useState<boolean | undefined>(undefined);
  const [showVaccinated, setShowVaccinated] = useState<boolean | undefined>(undefined);
  const [availabilityStatus, setAvailabilityStatus] = useState<string>('');
  
  // Service instance (memoized for performance)
  const houndService = useMemo(() => new HoundService(props.context), [props.context]);
  
  /**
   * Load hounds based on current filters
   */
  const loadHounds = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: IHoundFilters = {
        searchText: searchText.trim() || undefined,
        sex: selectedSex || undefined,
        desexed: showDesexed,
        hasC5Vaccine: showVaccinated,
        availabilityStatus: props.showOnlyAvailable ? 'available' : availabilityStatus
      };
      
      const results = await houndService.searchHounds(filters, props.pageSize, page);
      setSearchResults(results);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load greyhounds. Please try again later.');
      setSearchResults({ hounds: [], totalCount: 0, hasMore: false });
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedSex, showDesexed, showVaccinated, availabilityStatus, props.pageSize, props.showOnlyAvailable, houndService]);
  
  /**
   * Initial load
   */
  useEffect(() => {
    loadHounds(1);
  }, []); // Only run on mount
  
  /**
   * Auto-apply filters when they change
   */
  useEffect(() => {
    // Skip initial mount
    const timer = setTimeout(() => {
      loadHounds(1);
    }, 500); // Debounce filter changes
    
    return () => clearTimeout(timer);
  }, [selectedSex, showDesexed, showVaccinated, availabilityStatus]); // React to filter changes
  
  /**
   * Handle search button click
   */
  const handleSearch = useCallback(() => {
    loadHounds(1);
  }, [loadHounds]);
  
  /**
   * Handle clear filters
   */
  const handleClearFilters = useCallback(() => {
    setSearchText('');
    setSelectedSex('');
    setShowDesexed(undefined);
    setShowVaccinated(undefined);
    setAvailabilityStatus('');
    setCurrentPage(1);
    // Load with cleared filters
    setTimeout(() => loadHounds(1), 0);
  }, [loadHounds]);
  
  /**
   * Handle hound selection for details
   */
  const handleHoundSelect = useCallback((hound: IHound) => {
    setSelectedHound(hound);
    setIsPanelOpen(true);
  }, []);
  
  /**
   * Handle pagination
   */
  const handlePageChange = useCallback((page: number) => {
    loadHounds(page);
  }, [loadHounds]);
  
  // Calculate total pages
  const totalPages = Math.ceil(searchResults.totalCount / props.pageSize);
  
  // Define columns for DataGrid
  const houndColumns: DataGridColumn<IHound>[] = [
    {
      key: 'displayName',
      label: 'Name',
      minWidth: '150px',
      maxWidth: '200px',
      sortable: true,
      render: (value: any, item: IHound) => (
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            handleHoundSelect(item);
          }}
          style={{ color: '#0078d4', textDecoration: 'none' }}
        >
          {item.displayName}
        </a>
      )
    },
    {
      key: 'cr0d3_microchipnumber',
      label: 'Microchip',
      minWidth: '100px',
      maxWidth: '150px',
      sortable: true
    },
    {
      key: 'earBrands',
      label: 'Ear Brands',
      minWidth: '100px',
      maxWidth: '150px',
      render: (value: any, item: IHound) => (
        <span>
          {item.cr0d3_earbrandleft && item.cr0d3_earbrandright
            ? `${item.cr0d3_earbrandleft} / ${item.cr0d3_earbrandright}`
            : item.cr0d3_earbrandleft || item.cr0d3_earbrandright || '-'}
        </span>
      )
    },
    {
      key: 'cr0d3_sex',
      label: 'Sex',
      minWidth: '60px',
      maxWidth: '80px',
      sortable: true
    },
    {
      key: 'cr0d3_colour',
      label: 'Colour',
      minWidth: '80px',
      maxWidth: '120px',
      sortable: true
    },
    {
      key: 'age',
      label: 'Age',
      minWidth: '60px',
      maxWidth: '80px',
      sortable: true,
      render: (value: any, item: IHound) => (
        <span>{item.age !== undefined ? `${item.age}y` : '-'}</span>
      )
    },
    {
      key: 'cr0d3_desexed',
      label: 'Desexed',
      minWidth: '70px',
      maxWidth: '90px',
      render: (value: any, item: IHound) => (
        <span style={{ color: item.cr0d3_desexed ? '#107c10' : '#a4262c' }}>
          {item.cr0d3_desexed ? '✓ Yes' : '✗ No'}
        </span>
      )
    },
    {
      key: 'cr0d3_c5vaccinegiven',
      label: 'C5 Vaccine',
      minWidth: '80px',
      maxWidth: '100px',
      render: (value: any, item: IHound) => (
        <span style={{ color: item.cr0d3_c5vaccinegiven ? '#107c10' : '#a4262c' }}>
          {item.cr0d3_c5vaccinegiven ? '✓ Yes' : '✗ No'}
        </span>
      )
    },
    {
      key: 'cr0d3_available',
      label: 'Status',
      minWidth: '100px',
      maxWidth: '150px',
      render: (value: any, item: IHound) => {
        const status = item.cr0d3_available || 'Available';
        const color = status === 'Adopted' ? '#a4262c' :
                     status === 'HASed' ? '#ff8c00' :
                     '#107c10';
        return <span style={{ color, fontWeight: 500 }}>{status}</span>;
      }
    }
  ];
  
  // Sex dropdown options
  const sexOptions: IDropdownOption[] = [
    { key: '', text: 'All' },
    { key: 'Male', text: 'Male' },
    { key: 'Female', text: 'Female' }
  ];
  
  // Availability dropdown options
  const availabilityOptions: IDropdownOption[] = [
    { key: 'available', text: 'Available' },
    { key: 'Adopted', text: 'Adopted' },
    { key: 'HASed', text: 'HASed' },
    { key: '', text: 'All' }
  ];

  return (
    <div className={styles.houndSearch}>
      <div className={styles.header}>
        <h2>{props.title}</h2>
      </div>
      
      {/* Search and Filters Section */}
      <div className={styles.searchSection}>
        <Stack tokens={{ childrenGap: 15 }}>
          {/* Main Search Bar */}
          <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
            <StackItem grow>
              <TextField
                label="Search by name, microchip, or ear brand"
                value={searchText}
                onChange={(_, value) => setSearchText(value || '')}
                placeholder="Enter search term..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </StackItem>
            <StackItem>
              <PrimaryButton 
                text="Search" 
                onClick={handleSearch}
                disabled={loading}
                iconProps={{ iconName: 'Search' }}
              />
            </StackItem>
            <StackItem>
              <DefaultButton 
                text="Clear" 
                onClick={handleClearFilters}
                disabled={loading}
                iconProps={{ iconName: 'Clear' }}
              />
            </StackItem>
          </Stack>
          
          {/* Advanced Filters */}
          {props.enableAdvancedFilters && (
            <Stack horizontal tokens={{ childrenGap: 15 }} wrap>
              <StackItem>
                <Dropdown
                  label="Sex"
                  selectedKey={selectedSex}
                  options={sexOptions}
                  onChange={(_, option) => setSelectedSex(option?.key as string || '')}
                  styles={{ root: { minWidth: 120 } }}
                />
              </StackItem>
              
              {!props.showOnlyAvailable && (
                <StackItem>
                  <Dropdown
                    label="Availability"
                    selectedKey={availabilityStatus}
                    options={availabilityOptions}
                    onChange={(_, option) => setAvailabilityStatus(option?.key as string || '')}
                    styles={{ root: { minWidth: 150 } }}
                  />
                </StackItem>
              )}
              
              <StackItem>
                <Toggle
                  label="Desexed only"
                  checked={showDesexed === true}
                  onChange={(_, checked) => setShowDesexed(checked ? true : undefined)}
                />
              </StackItem>
              
              <StackItem>
                <Toggle
                  label="C5 Vaccinated only"
                  checked={showVaccinated === true}
                  onChange={(_, checked) => setShowVaccinated(checked ? true : undefined)}
                />
              </StackItem>
              
            </Stack>
          )}
        </Stack>
      </div>
      
      {/* Results Section */}
      <div className={styles.resultsSection}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
            {error}
          </MessageBar>
        )}
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner size={SpinnerSize.large} label="Loading greyhounds..." />
          </div>
        ) : (
          <>
            <div className={styles.resultsSummary}>
              <Label>{`Found ${searchResults.totalCount} greyhound${searchResults.totalCount !== 1 ? 's' : ''}`}</Label>
            </div>
            
            <DataGrid<IHound>
              data={searchResults.hounds}
              columns={houndColumns}
              loading={loading}
              error={error || ''}
              pagination
              pageSize={props.pageSize}
              virtualScroll
              onRowClick={handleHoundSelect}
              theme="neutral"
              striped
              hoverable
              emptyStateTitle="No greyhounds found"
              emptyStateMessage="Try adjusting your filters or search terms."
            />
            
          </>
        )}
      </div>
      
      {/* Details Panel */}
      <Panel
        isOpen={isPanelOpen}
        onDismiss={() => setIsPanelOpen(false)}
        type={PanelType.medium}
        headerText={selectedHound?.displayName || 'Greyhound Details'}
        closeButtonAriaLabel="Close"
      >
        {selectedHound && (
          <div className={styles.houndDetails}>
            <Stack tokens={{ childrenGap: 15 }}>
              <StackItem>
                <Label>Racing Name</Label>
                <div>{selectedHound.cr0d3_racingname || 'Not available'}</div>
              </StackItem>
              
              <StackItem>
                <Label>Microchip</Label>
                <div>{selectedHound.cr0d3_microchipnumber}</div>
              </StackItem>
              
              <StackItem>
                <Label>Ear Brands</Label>
                <div>
                  Left: {selectedHound.cr0d3_earbrandleft || 'N/A'} | 
                  Right: {selectedHound.cr0d3_earbrandright || 'N/A'}
                </div>
              </StackItem>
              
              <StackItem>
                <Label>Details</Label>
                <div>Sex: {selectedHound.cr0d3_sex || 'Unknown'}</div>
                <div>Colour: {selectedHound.cr0d3_colour || 'Unknown'}</div>
                <div>Age: {selectedHound.age ? `${selectedHound.age} years` : 'Unknown'}</div>
                <div>Weight: {selectedHound.cr0d3_weight || 'Unknown'}</div>
              </StackItem>
              
              <StackItem>
                <Label>Status</Label>
                <div>Desexed: {selectedHound.cr0d3_desexed ? 'Yes' : 'No'}</div>
                <div>C5 Vaccinated: {selectedHound.cr0d3_c5vaccinegiven ? 'Yes' : 'No'}</div>
                <div>Availability: {selectedHound.cr0d3_available || 'Available'}</div>
              </StackItem>
              
              {selectedHound.cr0d3_assessmentdate && (
                <StackItem>
                  <Label>Assessment Date</Label>
                  <div>{new Date(selectedHound.cr0d3_assessmentdate).toLocaleDateString('en-AU')}</div>
                </StackItem>
              )}
            </Stack>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default HoundSearch;