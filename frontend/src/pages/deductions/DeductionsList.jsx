import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Grid, Paper, Chip, IconButton, Tooltip, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon, Visibility as ViewIcon, Warning as DisputeIcon,
  PlayArrow as AutoMatchIcon, Assessment as ReconcileIcon,
  Receipt as DeductionIcon, ErrorOutline as UnmatchedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import deductionService from '../../services/deduction/deductionService';
import { deductionMatchService } from '../../services/api';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import analytics from '../../utils/analytics';
import { formatLabel } from '../../utils/formatters';

const DeductionsList = () => {
  const navigate = useNavigate();
  const [deductions, setDeductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState('all');
  const [statistics, setStatistics] = useState(null);
  const [matchDialog, setMatchDialog] = useState({ open: false, results: [], loading: false });

  useEffect(() => {
    loadDeductions();
    loadStatistics();
    analytics.trackEvent('deductions_list_viewed', { filter });
  }, [filter]);

  const loadDeductions = async () => {
    try {
      setLoading(true);
      setError(null);
      let response;
      if (filter === 'unmatched') response = await deductionService.getUnmatchedDeductions();
      else if (filter === 'disputed') response = await deductionService.getDisputedDeductions();
      else response = await deductionService.getAllDeductions();
      setDeductions(response.data || []);
    } catch (err) {
      console.error('Error loading deductions:', err);
      setError(err.message || 'Failed to load deductions');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await deductionService.getDeductionStatistics();
      setStatistics(response.data);
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleAutoMatch = async () => {
    try {
      setMatchDialog({ open: true, results: [], loading: true });
      const response = await deductionMatchService.autoMatch();
      if (response.success && response.data?.matches) {
        setMatchDialog({ open: true, results: response.data.matches, loading: false });
        analytics.trackEvent('deductions_ai_matched', { matchCount: response.data.matches.length });
      } else {
        setMatchDialog({ open: true, results: [], loading: false });
      }
    } catch (err) {
      console.error('Error AI-matching deductions:', err);
      setMatchDialog({ open: false, results: [], loading: false });
      setError(err.message || 'Failed to AI-match deductions');
    }
  };

  const getStatusColor = (status) => ({ identified: 'info', under_review: 'warning', valid: 'success', invalid: 'error', disputed: 'error', resolved: 'success', written_off: 'default' })[status] || 'default';
  const formatCurrency = (amount, currency = 'ZAR') => new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);
  const formatDate = (date) => new Date(date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });

  const deductionStats = useMemo(() => {
    const total = deductions.length;
    const totalAmount = deductions.reduce((s, d) => s + (d.deductionAmount || 0), 0);
    const unmatched = deductions.filter(d => !(d.matchedAmount > 0)).length;
    const disputed = deductions.filter(d => d.dispute?.isDisputed || d.status === 'disputed').length;
    return { total, totalAmount, unmatched, disputed };
  }, [deductions]);

  const summaryCards = [
    { label: 'Total Deductions', value: deductionStats.total, icon: <DeductionIcon />, color: '#7C3AED', bg: alpha('#7C3AED', 0.08) },
    { label: 'Total Value', value: formatCurrency(deductionStats.totalAmount), icon: <ReconcileIcon />, color: '#2563EB', bg: alpha('#2563EB', 0.08) },
    { label: 'Unmatched', value: deductionStats.unmatched, icon: <UnmatchedIcon />, color: '#D97706', bg: alpha('#D97706', 0.08) },
    { label: 'Disputed', value: deductionStats.disputed, icon: <DisputeIcon />, color: '#DC2626', bg: alpha('#DC2626', 0.08) },
  ];

  const filterTabs = ['all', 'unmatched', 'disputed'];
  const filterTabIndex = filterTabs.indexOf(filter);

  if (loading && deductions.length === 0) return <SkeletonLoader type="table" />;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Deductions</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Track, match, and reconcile deductions</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<ReconcileIcon />} onClick={() => navigate('/deductions/reconciliation')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, borderColor: '#E5E7EB', color: '#6B7280', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            Reconciliation
          </Button>
          <Button variant="outlined" startIcon={<AutoMatchIcon />} onClick={handleAutoMatch} disabled={loading}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, borderColor: '#E5E7EB', color: '#6B7280', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            Auto-Match
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/deductions/create')}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Create Deduction
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs value={filterTabIndex >= 0 ? filterTabIndex : 0} onChange={(_, v) => setFilter(filterTabs[v])}
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48, fontSize: '0.875rem' }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
            <Tab label="All" />
            <Tab label="Unmatched" />
            <Tab label="Disputed" />
          </Tabs>
          <Chip label={`${deductions.length} items`} size="small" sx={{ bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED', fontWeight: 600 }} />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem', bgcolor: '#F9FAFB' } }}>
                <TableCell>Deduction ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Matched</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deductions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <DeductionIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No deductions found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                deductions.map((deduction) => (
                  <TableRow key={deduction.id || deduction._id} hover sx={{ '&:hover': { bgcolor: alpha('#7C3AED', 0.02) } }}>
                    <TableCell><Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{deduction.deductionNumber || deduction.deductionId || deduction.id || '-'}</Typography></TableCell>
                    <TableCell><Chip label={formatLabel(deduction.deductionType || deduction.deduction_type || 'unknown')} size="small" variant="outlined" sx={{ borderRadius: '6px', height: 24 }} /></TableCell>
                    <TableCell><Typography variant="body2">{deduction.customerName || deduction.customer?.name || 'Unknown'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{deduction.deductionDate ? formatDate(deduction.deductionDate) : '-'}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>{formatCurrency(deduction.deductionAmount || 0, deduction.currency)}</Typography>
                      {deduction.validatedAmount && deduction.validatedAmount !== deduction.deductionAmount && (
                        <Typography variant="caption" color="text.secondary" display="block">Validated: {formatCurrency(deduction.validatedAmount, deduction.currency)}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip label={formatLabel(deduction.status || 'unknown')} color={getStatusColor(deduction.status)} size="small" sx={{ borderRadius: '6px', height: 24, fontWeight: 600 }} />
                        {deduction.dispute?.isDisputed && <Tooltip title="Disputed"><DisputeIcon color="error" sx={{ fontSize: 16 }} /></Tooltip>}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={(deduction.matchedAmount || 0) > 0 ? 'Matched' : 'Unmatched'}
                        color={(deduction.matchedAmount || 0) > 0 ? 'success' : 'error'} size="small"
                        sx={{ borderRadius: '6px', height: 24, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => navigate(`/deductions/${deduction.id || deduction._id}`)}
                          sx={{ color: '#6B7280', '&:hover': { bgcolor: alpha('#7C3AED', 0.08), color: '#7C3AED' } }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={matchDialog.open} onClose={() => !matchDialog.loading && setMatchDialog({ open: false, results: [], loading: false })}
        maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoMatchIcon /> AI Match Results
        </DialogTitle>
        <DialogContent>
          {matchDialog.loading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">Analyzing deductions and finding matches...</Typography>
            </Box>
          ) : matchDialog.results.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: '12px' }}>No match candidates found for current deductions.</Alert>
          ) : (
            matchDialog.results.map((match, idx) => (
              <Paper key={idx} elevation={0} sx={{ p: 2, mb: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{match.deductionId || `Deduction ${idx + 1}`}</Typography>
                  <Chip label={`${match.confidence || match.score || 0}% confidence`} size="small"
                    sx={{ borderRadius: '6px', fontWeight: 600,
                      bgcolor: alpha((match.confidence || match.score || 0) >= 80 ? '#059669' : (match.confidence || match.score || 0) >= 50 ? '#D97706' : '#DC2626', 0.1),
                      color: (match.confidence || match.score || 0) >= 80 ? '#059669' : (match.confidence || match.score || 0) >= 50 ? '#D97706' : '#DC2626'
                    }} />
                </Box>
                {match.candidates && match.candidates.map((c, ci) => (
                  <Box key={ci} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5, pl: 2 }}>
                    <Typography variant="caption" color="text.secondary">{c.promotionName || c.promotionId || `Candidate ${ci + 1}`}</Typography>
                    <Chip label={`${c.score || 0}%`} size="small" variant="outlined" sx={{ borderRadius: '6px', height: 20, fontSize: '0.7rem' }} />
                  </Box>
                ))}
                {match.matchedPromotion && (
                  <Typography variant="caption" color="success.main" fontWeight={600}>Matched to: {match.matchedPromotion}</Typography>
                )}
              </Paper>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setMatchDialog({ open: false, results: [], loading: false }); loadDeductions(); }}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeductionsList;
