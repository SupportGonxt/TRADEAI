// Revolutionary Data Table Component
// TRADEAI Next-Gen UI - Zero-Slop Compliant

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  CloudDownload,
  Refresh,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { useDataFetcher } from '../hooks/useDataFetcher';

// Column definition
export interface TableColumn<T> {
  id: keyof T | string;
  label: string;
  numeric?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  format?: (value: any, row?: T) => React.ReactNode;
  width?: number | string;
}

// Data table props
interface RevolutionaryDataTableProps<T> {
  title: string;
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  onRefresh?: () => void;
  onRowClick?: (row: T) => void;
  onExport?: () => void;
  pageSizeOptions?: number[];
  enableSearch?: boolean;
  enableFilters?: boolean;
  emptyStateMessage?: string;
  errorMessage?: string;
}

// Revolutionary Data Table Component
const RevolutionaryDataTable = <T extends Record<string, any>>({
  title,
  columns,
  data,
  loading = false,
  error = null,
  isEmpty = false,
  onRefresh,
  onRowClick,
  onExport,
  pageSizeOptions = [5, 10, 25, 50],
  enableSearch = true,
  enableFilters = true,
  emptyStateMessage = "No data available",
  errorMessage = "Failed to load data"
}: RevolutionaryDataTableProps<T>) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [searchText, setSearchText] = useState('');

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sort request
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let filteredData = [...data];

    // Apply search filter
    if (searchText) {
      filteredData = filteredData.filter(row => {
        return columns.some(column => {
          const value = row[column.id as keyof T];
          return value && value.toString().toLowerCase().includes(searchText.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (orderBy) {
      filteredData.sort((a, b) => {
        const aValue = a[orderBy as keyof T];
        const bValue = b[orderBy as keyof T];
        
        if (aValue < bValue) {
          return order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, searchText, orderBy, order, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    return processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [processedData, page, rowsPerPage]);

  // Render cell content
  const renderCellContent = (column: TableColumn<T>, row: T) => {
    const value = row[column.id as keyof T];
    
    if (column.format) {
      return column.format(value, row);
    }
    
    if (value === null || value === undefined) {
      return '-';
    }
    
    if (typeof value === 'boolean') {
      return <Chip 
        label={value ? 'Yes' : 'No'} 
        size="small" 
        color={value ? 'success' : 'default'} 
        variant="outlined" 
      />;
    }
    
    return String(value);
  };

  // Render sort icon
  const renderSortIcon = (columnId: string) => {
    if (orderBy === columnId) {
      return order === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />;
    }
    return null;
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        width: '100%', 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      {/* Table Header */}
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.subtle'
        }}
      >
        <Typography variant="h6" fontWeight="medium">
          {title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {enableSearch && (
            <TextField
              size="small"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, fontSize: 16 }} />,
              }}
              sx={{ width: 200 }}
            />
          )}
          
          {onRefresh && (
            <Tooltip title="Refresh">
              <IconButton onClick={onRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
          
          {onExport && (
            <Tooltip title="Export">
              <IconButton onClick={onExport}>
                <CloudDownload />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box p={2}>
          <Alert severity="error">
            <Typography variant="body1" fontWeight="medium">
              {errorMessage}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {error}
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Empty State */}
      {!loading && !error && isEmpty && (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          p={8}
          textAlign="center"
        >
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {emptyStateMessage}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There is no data to display at this time.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Data Table */}
      {!loading && !error && !isEmpty && (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.id)}
                      align={column.numeric ? 'right' : 'left'}
                      sortDirection={orderBy === column.id ? order : false}
                      sx={{ 
                        fontWeight: 'medium',
                        backgroundColor: 'background.subtle',
                        minWidth: column.width
                      }}
                    >
                      {column.sortable !== false ? (
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleRequestSort(String(column.id))}
                          IconComponent={() => renderSortIcon(String(column.id))}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    hover
                    onClick={() => onRowClick && onRowClick(row)}
                    sx={{ 
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:last-child td, &:last-child th': { border: 0 }
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`${index}-${String(column.id)}`}
                        align={column.numeric ? 'right' : 'left'}
                        sx={{ 
                          py: 1.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {renderCellContent(column, row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={pageSizeOptions}
            component="div"
            count={processedData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          />
        </>
      )}
    </Paper>
  );
};

export default RevolutionaryDataTable;