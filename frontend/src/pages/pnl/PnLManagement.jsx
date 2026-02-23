import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, Alert, Tabs, Tab,
  Tooltip, TableSortLabel, alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as GenerateIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as PnLIcon,
  People as CustomerIcon,
  Campaign as PromotionIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { pnlService, customerService, promotionService } from '../../services/api';

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
    generating: { bg: '#FEF3C7', color: '#D97706' },
    generated: { bg: '#D1FAE5', color: '#059669' },
    approved: { bg: '#DBEAFE', color: '#2563EB' },
    published: { bg: '#EDE9FE', color: '#7C3AED' },
    archived: { bg: '#F3F4F6', color: '#9CA3AF' },
  };
  const c = colorMap[status] || colorMap.draft;
  return (
    <Chip
      label={status?.charAt(0).toUpperCase() + status?.slice(1)}
      size="small"
      sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.75rem' }}
    />
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
  reportType: 'customer',
  periodType: 'monthly',
  startDate: '',
  endDate: '',
  customerId: '',
  promotionId: '',
  productId: '',
  category: '',
  channel: '',
  region: '',
  currency: 'ZAR',
};

const PnLManagement = () => {
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [liveCustomerData, setLiveCustomerData] = useState([]);
  const [livePromoData, setLivePromoData] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReport, setDetailReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [options, setOptions] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(null);

  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pnlService.getAll();
      setReports(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await pnlService.getSummary();
      setSummary(res.data || null);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  const fetchLiveData = useCallback(async () => {
    try {
      setLiveLoading(true);
      const [custRes, promoRes] = await Promise.all([
        pnlService.getLiveByCustomer(),
        pnlService.getLiveByPromotion(),
      ]);
      setLiveCustomerData(custRes.data || []);
      setLivePromoData(promoRes.data || []);
    } catch (err) {
      console.error('Failed to fetch live P&L data:', err);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  const fetchRefData = useCallback(async () => {
    try {
      const [custRes, promoRes, optRes] = await Promise.all([
        customerService.getAll(),
        promotionService.getAll(),
        pnlService.getOptions(),
      ]);
      setCustomers(custRes.data || []);
      setPromotions(promoRes.data || []);
      setOptions(optRes.data || null);
    } catch (err) {
      console.error('Failed to fetch ref data:', err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchSummary();
    fetchLiveData();
    fetchRefData();
  }, [fetchReports, fetchSummary, fetchLiveData, fetchRefData]);

  const handleCreate = () => {
    setEditingReport(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setForm({
      name: report.name || '',
      description: report.description || '',
      reportType: report.reportType || report.report_type || 'customer',
      periodType: report.periodType || report.period_type || 'monthly',
      startDate: report.startDate || report.start_date || '',
      endDate: report.endDate || report.end_date || '',
      customerId: report.customerId || report.customer_id || '',
      promotionId: report.promotionId || report.promotion_id || '',
      productId: report.productId || report.product_id || '',
      category: report.category || '',
      channel: report.channel || '',
      region: report.region || '',
      currency: report.currency || 'ZAR',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingReport) {
        await pnlService.update(editingReport.id, form);
      } else {
        await pnlService.create(form);
      }
      setDialogOpen(false);
      fetchReports();
      fetchSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this P&L report?')) return;
    try {
      await pnlService.delete(id);
      fetchReports();
      fetchSummary();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerate = async (id) => {
    try {
      setGenerating(id);
      await pnlService.generate(id);
      fetchReports();
      fetchSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(null);
    }
  };

  const handleViewDetail = async (report) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const res = await pnlService.getById(report.id);
      setDetailReport(res.data || null);
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

  const sortedReports = [...reports].sort((a, b) => {
    const aVal = a[orderBy] || '';
    const bVal = b[orderBy] || '';
    if (order === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  const reportTypes = options?.reportTypes || [
    { value: 'customer', label: 'P&L by Customer' },
    { value: 'promotion', label: 'P&L by Promotion' },
    { value: 'product', label: 'P&L by Product' },
    { value: 'channel', label: 'P&L by Channel' },
    { value: 'period', label: 'P&L by Period' },
    { value: 'consolidated', label: 'Consolidated P&L' },
  ];

  const periodTypes = options?.periodTypes || [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annually', label: 'Annually' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            P&L Analysis
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Profit & Loss by Customer, Promotion, and more
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { fetchReports(); fetchSummary(); fetchLiveData(); }}
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
            New Report
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
            title="Total Reports"
            value={summary?.reports?.total || 0}
            subtitle={`${summary?.reports?.generated || 0} generated`}
            icon={<ReportIcon />}
            color="#7C3AED"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Gross Sales"
            value={formatCurrency(summary?.financials?.totalGrossSales)}
            subtitle={`Margin: ${formatPct(summary?.financials?.avgGrossMargin)}`}
            icon={<TrendingUpIcon />}
            color="#059669"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Net Profit"
            value={formatCurrency(summary?.financials?.totalNetProfit)}
            subtitle={`Margin: ${formatPct(summary?.financials?.avgNetMargin)}`}
            icon={<PnLIcon />}
            color={(summary?.financials?.totalNetProfit || 0) >= 0 ? '#059669' : '#DC2626'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Avg ROI"
            value={formatPct(summary?.financials?.avgROI)}
            subtitle="Across all reports"
            icon={<TrendingUpIcon />}
            color="#2563EB"
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
          <Tab icon={<ReportIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Reports" />
          <Tab icon={<CustomerIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Live P&L by Customer" />
          <Tab icon={<PromotionIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Live P&L by Promotion" />
        </Tabs>

        {activeTab === 0 && (
          <TableContainer>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={32} sx={{ color: '#7C3AED' }} /></Box>
            ) : reports.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No P&L reports yet. Click &quot;New Report&quot; to create one.</Typography>
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
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Gross Sales</TableCell>
                    <TableCell align="right">Trade Spend</TableCell>
                    <TableCell align="right">Net Profit</TableCell>
                    <TableCell align="right">Margin</TableCell>
                    <TableCell align="right">ROI</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedReports.map((r) => (
                    <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.name}</Typography>
                        {r.description && <Typography variant="caption" color="text.secondary">{r.description}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={reportTypes.find(t => t.value === (r.reportType || r.report_type))?.label || r.reportType || r.report_type}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell><StatusChip status={r.status} /></TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {formatCurrency(r.grossSales || r.gross_sales)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {formatCurrency(r.tradeSpend || r.trade_spend)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: (r.netProfit || r.net_profit || 0) >= 0 ? '#059669' : '#DC2626' }}>
                        {formatCurrency(r.netProfit || r.net_profit)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {formatPct(r.netMarginPct || r.net_margin_pct)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {formatPct(r.roi)}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetail(r)}>
                              <ViewIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          {(r.status === 'draft' || r.status === 'generated') && (
                            <Tooltip title="Generate P&L">
                              <IconButton size="small" onClick={() => handleGenerate(r.id)} disabled={generating === r.id} sx={{ color: '#059669' }}>
                                {generating === r.id ? <CircularProgress size={16} /> : <GenerateIcon sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEdit(r)}>
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(r.id)} sx={{ color: '#DC2626' }}>
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
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
          <TableContainer>
            {liveLoading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={32} sx={{ color: '#7C3AED' }} /></Box>
            ) : liveCustomerData.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No customer trade spend data found. Create trade spends to see live P&L.</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 600, color: '#6B7280', borderBottom: '2px solid #E5E7EB', whiteSpace: 'nowrap' } }}>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Gross Sales</TableCell>
                    <TableCell align="right">Trade Spend</TableCell>
                    <TableCell align="right">Net Sales</TableCell>
                    <TableCell align="right">COGS</TableCell>
                    <TableCell align="right">Gross Profit</TableCell>
                    <TableCell align="right">Gross Margin</TableCell>
                    <TableCell align="right">Accruals</TableCell>
                    <TableCell align="right">Net Profit</TableCell>
                    <TableCell align="right">Net Margin</TableCell>
                    <TableCell align="right">ROI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {liveCustomerData.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.customerName}</Typography>
                        <Typography variant="caption" color="text.secondary">{row.transactionCount} transactions</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.grossSales)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.tradeSpend)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.netSales)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.cogs)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.grossProfit)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatPct(row.grossMarginPct)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.accruals)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: row.netProfit >= 0 ? '#059669' : '#DC2626' }}>
                        {formatCurrency(row.netProfit)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatPct(row.netMarginPct)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: row.roi >= 0 ? '#059669' : '#DC2626' }}>
                        {formatPct(row.roi)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}

        {activeTab === 2 && (
          <TableContainer>
            {liveLoading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={32} sx={{ color: '#7C3AED' }} /></Box>
            ) : livePromoData.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No promotion trade spend data found. Create trade spends linked to promotions to see live P&L.</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 600, color: '#6B7280', borderBottom: '2px solid #E5E7EB', whiteSpace: 'nowrap' } }}>
                    <TableCell>Promotion</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Gross Sales</TableCell>
                    <TableCell align="right">Trade Spend</TableCell>
                    <TableCell align="right">Net Sales</TableCell>
                    <TableCell align="right">Gross Profit</TableCell>
                    <TableCell align="right">Gross Margin</TableCell>
                    <TableCell align="right">Accruals</TableCell>
                    <TableCell align="right">Net Profit</TableCell>
                    <TableCell align="right">Net Margin</TableCell>
                    <TableCell align="right">ROI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {livePromoData.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.promotionName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.promoStart && row.promoEnd ? `${row.promoStart.slice(0, 10)} - ${row.promoEnd.slice(0, 10)}` : `${row.transactionCount} txns`}
                        </Typography>
                      </TableCell>
                      <TableCell><StatusChip status={row.promoStatus || 'active'} /></TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.grossSales)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.tradeSpend)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.netSales)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.grossProfit)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatPct(row.grossMarginPct)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(row.accruals)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: row.netProfit >= 0 ? '#059669' : '#DC2626' }}>
                        {formatCurrency(row.netProfit)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatPct(row.netMarginPct)}</TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: row.roi >= 0 ? '#059669' : '#DC2626' }}>
                        {formatPct(row.roi)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingReport ? 'Edit P&L Report' : 'New P&L Report'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Report Name"
                fullWidth
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Report Type"
                select
                fullWidth
                value={form.reportType}
                onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                size="small"
              >
                {reportTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Period Type"
                select
                fullWidth
                value={form.periodType}
                onChange={(e) => setForm({ ...form, periodType: e.target.value })}
                size="small"
              >
                {periodTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Customer"
                select
                fullWidth
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                size="small"
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Promotion"
                select
                fullWidth
                value={form.promotionId}
                onChange={(e) => setForm({ ...form, promotionId: e.target.value })}
                size="small"
              >
                <MenuItem value="">All Promotions</MenuItem>
                {promotions.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Channel"
                fullWidth
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Region"
                fullWidth
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Currency"
                select
                fullWidth
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                size="small"
              >
                <MenuItem value="ZAR">ZAR</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name}
            sx={{ textTransform: 'none', bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
          >
            {saving ? <CircularProgress size={20} /> : editingReport ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PnLIcon sx={{ color: '#7C3AED' }} />
          {detailReport?.name || 'P&L Report Details'}
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress sx={{ color: '#7C3AED' }} /></Box>
          ) : detailReport ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Gross Sales</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                    {formatCurrency(detailReport.grossSales || detailReport.gross_sales)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Trade Spend</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#DC2626' }}>
                    {formatCurrency(detailReport.tradeSpend || detailReport.trade_spend)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Net Profit</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace', color: (detailReport.netProfit || detailReport.net_profit || 0) >= 0 ? '#059669' : '#DC2626' }}>
                    {formatCurrency(detailReport.netProfit || detailReport.net_profit)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary">ROI</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                    {formatPct(detailReport.roi)}
                  </Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Net Sales</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatCurrency(detailReport.netSales || detailReport.net_sales)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography variant="caption" color="text.secondary">COGS</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatCurrency(detailReport.cogs)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Gross Profit</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatCurrency(detailReport.grossProfit || detailReport.gross_profit)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Accruals</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatCurrency(detailReport.accruals)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Budget Amount</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatCurrency(detailReport.budgetAmount || detailReport.budget_amount)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Budget Variance</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: (detailReport.budgetVariance || detailReport.budget_variance || 0) >= 0 ? '#059669' : '#DC2626' }}>
                    {formatCurrency(detailReport.budgetVariance || detailReport.budget_variance)}
                  </Typography>
                </Grid>
              </Grid>

              {detailReport.lineItems && detailReport.lineItems.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Line Items Breakdown</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 600, color: '#6B7280', fontSize: '0.75rem' } }}>
                          <TableCell>#</TableCell>
                          <TableCell>Label</TableCell>
                          <TableCell align="right">Gross Sales</TableCell>
                          <TableCell align="right">Trade Spend</TableCell>
                          <TableCell align="right">Net Sales</TableCell>
                          <TableCell align="right">Gross Profit</TableCell>
                          <TableCell align="right">Net Profit</TableCell>
                          <TableCell align="right">Margin</TableCell>
                          <TableCell align="right">ROI</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailReport.lineItems.map((li, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{li.sortOrder || li.sort_order || idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{li.lineLabel || li.line_label || li.customerName || li.customer_name || li.promotionName || li.promotion_name || '-'}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(li.grossSales || li.gross_sales)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(li.tradeSpend || li.trade_spend)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(li.netSales || li.net_sales)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatCurrency(li.grossProfit || li.gross_profit)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: (li.netProfit || li.net_profit || 0) >= 0 ? '#059669' : '#DC2626' }}>
                              {formatCurrency(li.netProfit || li.net_profit)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatPct(li.netMarginPct || li.net_margin_pct)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{formatPct(li.roi)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">Report not found.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ textTransform: 'none' }}>Close</Button>
          {detailReport && (detailReport.status === 'draft' || detailReport.status === 'generated') && (
            <Button
              variant="contained"
              startIcon={generating === detailReport?.id ? <CircularProgress size={16} /> : <GenerateIcon />}
              onClick={() => { handleGenerate(detailReport.id); setDetailOpen(false); }}
              disabled={generating === detailReport?.id}
              sx={{ textTransform: 'none', bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
            >
              {detailReport.status === 'generated' ? 'Regenerate' : 'Generate'} P&L
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PnLManagement;
