import * as React from 'react';
import { 
  DetailsList, 
  DetailsListLayoutMode, 
  SelectionMode, 
  IColumn,
  IDetailsRowStyles,
  DetailsRow,
  IDetailsRowProps,
  IDetailsHeaderProps,
  DetailsHeader,
  mergeStyleSets,
  getTheme
} from '@fluentui/react';
import { IHound } from '../../../models/IHound';
import styles from './HoundSearch.module.scss';

export interface IHoundDataGridProps {
  hounds: IHound[];
  onHoundSelect: (hound: IHound) => void;
  loading: boolean;
}

/**
 * Data Grid component for displaying hound search results
 * Implements SOLID principle with single responsibility for data display
 */
export const HoundDataGrid: React.FC<IHoundDataGridProps> = ({ hounds, onHoundSelect, loading }) => {
  const theme = getTheme();
  
  // Define columns
  const columns: IColumn[] = [
    {
      key: 'displayName',
      name: 'Name',
      fieldName: 'displayName',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      onRender: (item: IHound) => (
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            onHoundSelect(item);
          }}
          className={styles.nameLink}
        >
          {item.displayName}
        </a>
      )
    },
    {
      key: 'microchip',
      name: 'Microchip',
      fieldName: 'cr0d3_microchipnumber',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true
    },
    {
      key: 'earBrands',
      name: 'Ear Brands',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: IHound) => (
        <span>
          {item.cr0d3_earbrandleft && item.cr0d3_earbrandright
            ? `${item.cr0d3_earbrandleft} / ${item.cr0d3_earbrandright}`
            : item.cr0d3_earbrandleft || item.cr0d3_earbrandright || '-'}
        </span>
      )
    },
    {
      key: 'sex',
      name: 'Sex',
      fieldName: 'cr0d3_sex',
      minWidth: 60,
      maxWidth: 80,
      isResizable: true
    },
    {
      key: 'colour',
      name: 'Colour',
      fieldName: 'cr0d3_colour',
      minWidth: 80,
      maxWidth: 120,
      isResizable: true
    },
    {
      key: 'age',
      name: 'Age',
      minWidth: 60,
      maxWidth: 80,
      isResizable: true,
      onRender: (item: IHound) => (
        <span>{item.age !== undefined ? `${item.age}y` : '-'}</span>
      )
    },
    {
      key: 'desexed',
      name: 'Desexed',
      minWidth: 70,
      maxWidth: 90,
      isResizable: true,
      onRender: (item: IHound) => (
        <span className={item.cr0d3_desexed ? styles.statusYes : styles.statusNo}>
          {item.cr0d3_desexed ? '✓ Yes' : '✗ No'}
        </span>
      )
    },
    {
      key: 'vaccinated',
      name: 'C5 Vaccine',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
      onRender: (item: IHound) => (
        <span className={item.cr0d3_c5vaccinegiven ? styles.statusYes : styles.statusNo}>
          {item.cr0d3_c5vaccinegiven ? '✓ Yes' : '✗ No'}
        </span>
      )
    },
    {
      key: 'status',
      name: 'Status',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: IHound) => {
        const status = item.cr0d3_available || 'Available';
        const statusClass = status === 'Adopted' ? styles.statusAdopted :
                          status === 'HASed' ? styles.statusHased :
                          styles.statusAvailable;
        return <span className={statusClass}>{status}</span>;
      }
    }
  ];
  
  // Custom styles for the grid
  const gridStyles = mergeStyleSets({
    root: {
      selectors: {
        '.ms-DetailsRow': {
          borderBottom: `1px solid ${theme.palette.neutralLight}`,
          selectors: {
            '&:hover': {
              backgroundColor: theme.palette.neutralLighter,
              cursor: 'pointer'
            }
          }
        },
        '.ms-DetailsHeader': {
          paddingTop: 0,
          borderBottom: `2px solid ${theme.palette.themePrimary}`
        }
      }
    }
  });
  
  // Custom row renderer
  const onRenderRow = (props?: IDetailsRowProps): JSX.Element | null => {
    if (!props) return null;
    
    const customStyles: Partial<IDetailsRowStyles> = {};
    
    // Highlight adopted dogs
    if (props.item?.cr0d3_available === 'Adopted') {
      customStyles.root = {
        backgroundColor: theme.palette.neutralLighter,
        opacity: 0.8
      };
    }
    
    return <DetailsRow {...props} styles={customStyles} />;
  };
  
  // Custom header renderer
  const onRenderDetailsHeader = (props?: IDetailsHeaderProps): JSX.Element | null => {
    if (!props) return null;
    return <DetailsHeader {...props} />;
  };
  
  // Handle row click
  const handleItemInvoked = (item: IHound): void => {
    onHoundSelect(item);
  };
  
  if (hounds.length === 0 && !loading) {
    return (
      <div className={styles.noResults}>
        <p>No greyhounds found matching your search criteria.</p>
        <p>Try adjusting your filters or search terms.</p>
      </div>
    );
  }
  
  return (
    <div className={gridStyles.root}>
      <DetailsList
        items={hounds}
        columns={columns}
        setKey="hounds"
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
        onRenderRow={onRenderRow}
        onRenderDetailsHeader={onRenderDetailsHeader}
        onItemInvoked={handleItemInvoked}
        ariaLabelForSelectionColumn="Toggle selection"
        ariaLabelForSelectAllCheckbox="Toggle selection for all items"
        checkButtonAriaLabel="select row"
      />
    </div>
  );
};