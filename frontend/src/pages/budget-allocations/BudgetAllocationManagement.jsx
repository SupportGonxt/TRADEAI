import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Alert, Tabs, Tab,
  Tooltip, TableSortLabel, alpha, LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  AccountTree as DistributeIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BudgetIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { budgetAllocationService, budgetService } from '../../services/api';

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R 0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'R 0.00';
  return `R ${num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPct = (value) => {
  if (value === null || value === undefined) return '0.00%';
  return `${(typeof value === 'number' ? value : parseFloat(value) || 0).toFixed(2)}%`;
};

const StatusChip = ({ status }) => {
  const colorMap = {
    draft: { bg: '#F3F4F6', color: '#6B7280' },
    pending_approval: { bg: '#FEF3C7', color: '#D97706' },
    approved: { bg: '#DBEAFE', color: '#2563EB' },
    active: { bg: '#D1FAE5', color: '#059669' },
    locked: { bg: '#EDE9FE', color: '#7C3AED' },
    archived: { bg: '#F3F4F6', color: '#9CA3AF' },
  };
  const c = colorMap[status] || colorMap.draft;
  return (
    <Chip
      label={(status || 'draft').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem' }}
    />
  );
};

const UtilizationBar = ({ value, size = 'medium' }) => {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct > 90 ? '#DC2626' : pct > 70 ? '#D97706' : '#059669';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          flex: 1,
          height: size === 'small' ? 4 : 6,
          borderRadius: 3,
          bgcolor: '#F3F4F6',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography variant="caption" sx={{ fontWeight: 600, color, minWidth: 40, textAlign: 'right' }}>
        {formatPct(pct)}
      </Typography>
    </Box>
  );
};

const SummaryCard = ({ title, value, subtitle, icon, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#111827' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const EMPTY_FORM = {
  name: '',
  description: '',
  allocationMethod: 'top_down',
  budgetId: '',
  sourceAmount: '',
  fiscalYear: new Date().getFullYear(),
  periodType: 'annual',
  startDate: '',
  endDate: '',
  dimension: 'customer',
  currency: 'ZAR',
  notes: '',
};

const BudgetAllocationManagement = () => {
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAllocation, setDetailAllocation] = useState(null);
  const [detailLines, setDetailLines] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [waterfallData, setWaterfallData] = useState([]);
  const [waterfallLoading, setWaterfallLoading] = useState(false);

  const [budgets, setBudgets] = useState([]);
  const [options, setOptions] = useState(null);
  const [saving, setSaving] = useState(false);
  const [distributing, setDistributing] = useState(null);

  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  const fetchAllocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await budgetAllocationService.getAll();
      setAllocations(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await budgetAllocationService.getSummary();
      setSummary(res.data || null);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  const fetchWaterfall = useCallback(async () => {
    try {
      setWaterfallLoading(true);
      const res = await budgetAllocationService.getWaterfall();
      setWaterfallData(res.data || []);
    } catch (err) {
      console.error('Failed to fetch waterfall:', err);
    } finally {
      setWaterfallLoading(false);
    }
  }, []);

  const fetchRefData = useCallback(async () => {
    try {
      const [budgetRes, optRes] = await Promise.all([
        budgetService.getAll(),
        budgetAllocationService.getOptions(),
      ]);
      setBudgets(budgetRes.data || []);
      setOptions(optRes.data || null);
    } catch (err) {
      console.error('Failed to fetch ref data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllocations();
    fetchSummary();
    fetchWaterfall();
    fetchRefData();
  }, [fetchAllocations, fetchSummary, fetchWaterfall, fetchRefData]);

  const handleCreate = () => {
    setEditingAllocation(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleEdit = (alloc) => {
    setEditingAllocation(alloc);
    setForm({
      name: alloc.name || '',
      description: alloc.description || '',
      allocationMethod: alloc.allocationMethod || alloc.allocation_method || 'top_down',
      budgetId: alloc.budgetId || alloc.budget_id || '',
      sourceAmount: alloc.sourceAmount || alloc.source_amount || '',
      fiscalYear: alloc.fiscalYear || alloc.fiscal_year || new Date().getFullYear(),
      periodType: alloc.periodType || alloc.period_type || 'annual',
      startDate: alloc.startDate || alloc.start_date || '',
      endDate: alloc.endDate || alloc.end_date || '',
      dimension: alloc.dimension || 'customer',
      currency: alloc.currency || 'ZAR',
      notes: alloc.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingAllocation) {
        await budgetAllocationService.update(editingAllocation.id, form);
      } else {
        await budgetAllocationService.create(form);
      }
      setDialogOpen(false);
      fetchAllocations();
      fetchSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget allocation and all its lines?')) return;
    try {
      await budgetAllocationService.delete(id);
      fetchAllocations();
      fetchSummary();
      fetchWaterfall();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDistribute = async (id) => {
    try {
      setDistributing(id);
      await budgetAllocationService.distribute(id, {});
      fetchAllocations();
      fetchSummary();
      fetchWaterfall();
    } catch (err) {
      setError(err.message);
    } finally {
      setDistributing(null);
    }
  };

  const handleLock = async (id) => {
    try {
      await budgetAllocationService.lock(id);
      fetchAllocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnlock = async (id) => {
    try {
      await budgetAllocationService.unlock(id);
      fetchAllocations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefreshUtilization = async (id) => {
    try {
      await budgetAllocationService.refreshUtilization(id);
      fetchAllocations();
      fetchSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDetail = async (alloc) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const res = await budgetAllocationService.getById(alloc.id);
      setDetailAllocation(res.data || null);
      setDetailLines(res.data?.lines || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSort = (column) => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  const sortedAllocations = [...allocations].sort((a, b) => {
    const aVal = a[orderBy] || '';
    const bVal = b[orderBy] || '';
    if (order === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  const handleBudgetSelect = (budgetId) => {
    const budget = budgets.find(b => b.id === budgetId);
    setForm(prev => ({
      ...prev,
      budgetId,
      sourceAmount: budget ? (budget.amount || '') : prev.sourceAmount,
    }));
  };

  const allocationMethods = options?.allocationMethods || [
    { value: 'top_down', label: 'Top-Down (Waterfall)' },
    { value: 'bottom_up', label: 'Bottom-Up (Roll-Up)' },
    { value: 'equal_split', label: 'Equal Split' },
    { value: 'proportional', label: 'Proportional (by Prior Year)' },
    { value: 'weighted', label: 'Weighted (Custom Weights)' },
  ];

  const dimensions = options?.dimensions || [
    { value: 'customer', label: 'By Customer' },
    { value: 'channel', label: 'By Channel' },
    { value: 'product', label: 'By Product' },
    { value: 'category', label: 'By Category' },
    { value: 'region', label: 'By Region' },
    { value: 'brand', label: 'By Brand' },
  ];

  const periodTypes = options?.periodTypes || [
    { value: 'annual', label: 'Annual' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            Budget Allocation Engine
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Hierarchical top-down budget distribution across customers, channels, products
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { fetchAllocations(); fetchSummary(); fetchWaterfall(); }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
          >
            New Allocation
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Allocations"
            value={summary?.allocations?.total || 0}
            subtitle={`${summary?.allocations?.active || 0} active, ${summary?.allocations?.locked || 0} locked`}
            icon={<ReportIcon />}
            color="#7C3AED"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Source Budget"
            value={formatCurrency(summary?.allocations?.totalSource)}
            subtitle="Total budget pool"
            icon={<BudgetIcon />}
            color="#059669"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Allocated"
            value={formatCurrency(summary?.allocations?.totalAllocated)}
            subtitle={`Remaining: ${formatCurrency(summary?.allocations?.totalRemaining)}`}
            icon={<DistributeIcon />}
            color="#2563EB"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Utilization"
            value={formatPct(summary?.allocations?.avgUtilization)}
            subtitle={`${formatCurrency(summary?.allocations?.totalUtilized)} utilized`}
            icon={<TrendingUpIcon />}
            color={((summary?.allocations?.avgUtilization || 0) > 90) ? '#DC2626' : '#059669'}
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: 2, pt: 1,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 44 },
            '& .Mui-selected': { color: '#7C3AED' },
            '& .MuiTabs-indicator': { bgcolor: '#7C3AED' },
          }}
        >
          <Tab icon={<ReportIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Allocations" />
          <Tab icon={<DistributeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Budget Waterfall" />
        </Tabs>

        {activeTab === 0 && (
          <TableContainer>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={32} sx={{ color: '#7C3AED' }} /></Box>
            ) : allocations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No budget allocations yet. Click &quot;New Allocation&quot; to create one.</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 600, color: '#6B7280', borderBottom: '2px solid #E5E7EB' } }}>
                    <TableCell>
                      <TableSortLabel active={orderBy === 'name'} direction={orderBy === 'name' ? order : 'asc'} onClick={() => handleSort('name')}>
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Dimension</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Source</TableCell>
                    <TableCell align="right">Allocated</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Utilization</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedAllocations.map((a) => (
                    <TableRow key={a.id} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{a.name}</Typography>
                        {a.description && <Typography variant="caption" color="text.secondary">{a.description}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={allocationMethods.find(m => m.value === (a.allocationMethod || a.allocation_method))?.label || a.allocationMethod || a.allocation_method}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={dimensions.find(d => d.value === a.dimension)?.label || a.dimension}
                          size="small"
                          sx={{ fontSize: '0.7rem', bgcolor: '#EDE9FE', color: '#7C3AED' }}
                        />
                      </TableCell>
                      <TableCell><StatusChip status={a.status} /></TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {formatCurrency(a.sourceAmount || a.source_amount)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {formatCurrency(a.allocatedAmount || a.allocated_amount)}
                      </TableCell>
                      <TableCell>
                        <UtilizationBar value={a.utilizationPct || a.utilization_pct} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetail(a)}>
                              <ViewIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Distribute Budget">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDistribute(a.id)}
                                disabled={!!a.locked || distributing === a.id}
                              >
                                {distributing === a.id ? <CircularProgress size={16} /> : <DistributeIcon sx={{ fontSize: 18, color: '#059669' }} />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Refresh Utilization">
                            <IconButton size="small" onClick={() => handleRefreshUtilization(a.id)}>
                              <RefreshIcon sx={{ fontSize: 18, color: '#2563EB' }} />
                            </IconButton>
                          </Tooltip>
                          {a.locked ? (
                            <Tooltip title="Unlock">
                              <IconButton size="small" onClick={() => handleUnlock(a.id)}>
                                <UnlockIcon sx={{ fontSize: 18, color: '#D97706' }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Lock">
                              <IconButton size="small" onClick={() => handleLock(a.id)}>
                                <LockIcon sx={{ fontSize: 18, color: '#7C3AED' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <span>
                              <IconButton size="small" onClick={() => handleEdit(a)} disabled={!!a.locked}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <span>
                              <IconButton size="small" onClick={() => handleDelete(a.id)} disabled={!!a.locked}>
                                <DeleteIcon sx={{ fontSize: 18, color: '#DC2626' }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            {waterfallLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={32} sx={{ color: '#7C3AED' }} /></Box>
            ) : waterfallData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No waterfall data available. Create allocations linked to budgets first.</Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {waterfallData.map((bucket) => (
                  <Grid item xs={12} key={bucket.budgetId}>
                    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{bucket.budgetName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Budget: {formatCurrency(bucket.totalBudget)} | Spend: {formatCurrency(bucket.totalSpend)}
                            </Typography>
                          </Box>
                          <UtilizationBar value={bucket.totalBudget > 0 ? (bucket.totalSpend / bucket.totalBudget) * 100 : 0} />
                        </Box>
                        {bucket.allocations && bucket.allocations.length > 0 ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ '& th': { fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' } }}>
                                <TableCell>Dimension</TableCell>
                                <TableCell align="right">Allocated</TableCell>
                                <TableCell align="right">Utilized</TableCell>
                                <TableCell align="right">Committed</TableCell>
                                <TableCell align="right">Remaining</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {bucket.allocations.map((line, i) => (
                                <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {line.dimensionName || line.dimension_name || '-'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {line.dimensionType || line.dimension_type}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {formatCurrency(line.allocatedAmount || line.allocated_amount)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {formatCurrency(line.utilizedAmount || line.utilized_amount)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {formatCurrency(line.committedAmount || line.committed_amount)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {formatCurrency(line.remainingAmount || line.remaining_amount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                            No allocations linked to this budget yet.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingAllocation ? 'Edit Budget Allocation' : 'New Budget Allocation'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                fullWidth
                required
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Source Budget"
                fullWidth
                select
                value={form.budgetId}
                onChange={(e) => handleBudgetSelect(e.target.value)}
                size="small"
              >
                <MenuItem value="">None (Manual Amount)</MenuItem>
                {budgets.map(b => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} ({formatCurrency(b.amount)})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Source Amount (R)"
                fullWidth
                type="number"
                value={form.sourceAmount}
                onChange={(e) => setForm(prev => ({ ...prev, sourceAmount: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Allocation Method"
                fullWidth
                select
                value={form.allocationMethod}
                onChange={(e) => setForm(prev => ({ ...prev, allocationMethod: e.target.value }))}
                size="small"
              >
                {allocationMethods.map(m => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Distribute By"
                fullWidth
                select
                value={form.dimension}
                onChange={(e) => setForm(prev => ({ ...prev, dimension: e.target.value }))}
                size="small"
              >
                {dimensions.map(d => (
                  <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Fiscal Year"
                fullWidth
                type="number"
                value={form.fiscalYear}
                onChange={(e) => setForm(prev => ({ ...prev, fiscalYear: parseInt(e.target.value) }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Period Type"
                fullWidth
                select
                value={form.periodType}
                onChange={(e) => setForm(prev => ({ ...prev, periodType: e.target.value }))}
                size="small"
              >
                {periodTypes.map(p => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Currency"
                fullWidth
                value={form.currency}
                onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                fullWidth
                type="date"
                value={form.startDate}
                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                fullWidth
                type="date"
                value={form.endDate}
                onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={form.notes}
                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name}
            sx={{ textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
          >
            {saving ? <CircularProgress size={20} /> : (editingAllocation ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {detailAllocation?.name || 'Allocation Detail'}
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            {detailAllocation?.status && <StatusChip status={detailAllocation.status} />}
            {detailAllocation?.locked ? (
              <Chip icon={<LockIcon sx={{ fontSize: 14 }} />} label="Locked" size="small" sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontSize: '0.7rem' }} />
            ) : null}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={32} sx={{ color: '#7C3AED' }} /></Box>
          ) : detailAllocation ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Source Amount</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {formatCurrency(detailAllocation.sourceAmount || detailAllocation.source_amount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Allocated</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2563EB' }}>
                    {formatCurrency(detailAllocation.allocatedAmount || detailAllocation.allocated_amount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Utilized</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                    {formatCurrency(detailAllocation.utilizedAmount || detailAllocation.utilized_amount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Remaining</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#D97706' }}>
                    {formatCurrency(detailAllocation.remainingAmount || detailAllocation.remaining_amount)}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Overall Utilization</Typography>
                <UtilizationBar value={detailAllocation.utilizationPct || detailAllocation.utilization_pct} />
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, mt: 2 }}>
                Allocation Lines ({detailLines.length})
              </Typography>

              {detailLines.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 600, fontSize: '0.75rem', color: '#6B7280' } }}>
                        <TableCell>#</TableCell>
                        <TableCell>Entity</TableCell>
                        <TableCell align="right">Allocated</TableCell>
                        <TableCell align="right">% Share</TableCell>
                        <TableCell align="right">Utilized</TableCell>
                        <TableCell align="right">Remaining</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Utilization</TableCell>
                        <TableCell align="right">Prior Year</TableCell>
                        <TableCell align="right">YoY Growth</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailLines.map((line, idx) => (
                        <TableRow key={line.id || idx} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ color: '#9CA3AF' }}>{line.lineNumber || line.line_number || idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {line.dimensionName || line.dimension_name || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {formatCurrency(line.allocatedAmount || line.allocated_amount)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {formatPct(line.allocatedPct || line.allocated_pct)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {formatCurrency(line.utilizedAmount || line.utilized_amount)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {formatCurrency(line.remainingAmount || line.remaining_amount)}
                          </TableCell>
                          <TableCell>
                            <UtilizationBar value={line.utilizationPct || line.utilization_pct} size="small" />
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {formatCurrency(line.priorYearAmount || line.prior_year_amount)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: (line.priorYearGrowthPct || line.prior_year_growth_pct || 0) >= 0 ? '#059669' : '#DC2626' }}>
                            {formatPct(line.priorYearGrowthPct || line.prior_year_growth_pct)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No allocation lines yet. Click &quot;Distribute Budget&quot; to auto-allocate.
                </Typography>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetAllocationManagement;
