import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, Button, Chip, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tabs, Tab, LinearProgress, Alert, CircularProgress, Tooltip,
  InputAdornment, TablePagination
} from '@mui/material';
import {
  TrendingUp, TrendingDown, Warning, Star, AttachMoney, Lightbulb,
  Add, Refresh, Search, Person, Visibility, Edit, Delete,
  Speed, ThumbUp, ArrowBack, BarChart
} from '@mui/icons-material';
import { customer360Service } from '../../services/api';

const tierColors = { platinum: '#7C3AED', gold: '#F59E0B', silver: '#6B7280', bronze: '#92400E' };
const severityColors = { critical: '#EF4444', warning: '#F59E0B', info: '#3B82F6', success: '#10B981' };
const segmentColors = { strategic: '#7C3AED', key_account: '#3B82F6', growth: '#10B981', maintain: '#6B7280', at_risk: '#EF4444' };

const formatCurrency = (val) => {
  if (!val) return 'R0';
  if (val >= 1e9) return `R${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `R${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `R${(val / 1e3).toFixed(0)}K`;
  return `R${val.toLocaleString()}`;
};

const HealthBar = ({ score }) => {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ flex: 1, height: 8, bgcolor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${Math.min(100, score)}%`, bgcolor: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 600, color, minWidth: 32 }}>{Math.round(score)}</Typography>
    </Box>
  );
};

const Customer360Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [sortBy, setSortBy] = useState('total_revenue');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [insights, setInsights] = useState([]);
  const [atRiskCustomers, setAtRiskCustomers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [formData, setFormData] = useState({});
  const [detailView, setDetailView] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const res = await customer360Service.getSummary();
      if (res.success) setSummary(res.data);
    } catch (e) { console.error('Error loading summary:', e); }
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: rowsPerPage, offset: page * rowsPerPage, sort_by: sortBy, sort_order: 'desc' };
      if (search) params.search = search;
      if (tierFilter) params.tier = tierFilter;
      if (segmentFilter) params.segment = segmentFilter;
      const res = await customer360Service.getProfiles(params);
      if (res.success) { setProfiles(res.data || []); setTotal(res.total || 0); }
    } catch (e) { console.error('Error loading profiles:', e); }
    setLoading(false);
  }, [page, rowsPerPage, sortBy, search, tierFilter, segmentFilter]);

  const loadAtRisk = useCallback(async () => {
    try {
      const res = await customer360Service.getAtRisk({ threshold: 0.5 });
      if (res.success) setAtRiskCustomers(res.data || []);
    } catch (e) { console.error('Error loading at-risk:', e); }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const res = await customer360Service.getLeaderboard({ metric: 'total_revenue', limit: 10 });
      if (res.success) setLeaderboard(res.data || []);
    } catch (e) { console.error('Error loading leaderboard:', e); }
  }, []);

  useEffect(() => { loadSummary(); loadAtRisk(); loadLeaderboard(); }, [loadSummary, loadAtRisk, loadLeaderboard]);
  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const loadInsights = async (profileId) => {
    try {
      const res = await customer360Service.getInsights(profileId);
      if (res.success) setInsights(res.data || []);
    } catch (e) { console.error('Error loading insights:', e); }
  };

  const handleViewProfile = async (profile) => {
    setSelectedProfile(profile);
    setDetailView(true);
    await loadInsights(profile.id);
  };

  const handleCreate = () => {
    setDialogMode('create');
    setFormData({ tier: 'bronze', segment: 'maintain', status: 'active', healthScore: 50 });
    setDialogOpen(true);
  };

  const handleEdit = (profile) => {
    setDialogMode('edit');
    setFormData({ ...profile });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (dialogMode === 'create') {
        await customer360Service.createProfile(formData);
      } else {
        await customer360Service.updateProfile(formData.id, formData);
      }
      setDialogOpen(false);
      loadProfiles();
      loadSummary();
    } catch (e) { console.error('Error saving profile:', e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer 360 profile?')) return;
    try {
      await customer360Service.deleteProfile(id);
      loadProfiles();
      loadSummary();
    } catch (e) { console.error('Error deleting profile:', e); }
  };

  const handleRecalculate = async (id) => {
    try {
      const res = await customer360Service.recalculate(id);
      if (res.success && selectedProfile?.id === id) {
        setSelectedProfile(res.data);
      }
      loadProfiles();
      loadSummary();
    } catch (e) { console.error('Error recalculating:', e); }
  };

  if (detailView && selectedProfile) {
    const p = selectedProfile;
    const topProducts = (() => { try { return typeof p.topProducts === 'string' ? JSON.parse(p.topProducts) : (p.topProducts || []); } catch { return []; } })();
    const monthlyRevenue = (() => { try { return typeof p.monthlyRevenue === 'string' ? JSON.parse(p.monthlyRevenue) : (p.monthlyRevenue || []); } catch { return []; } })();

    return (
      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        <Button startIcon={<ArrowBack />} onClick={() => { setDetailView(false); setSelectedProfile(null); }} sx={{ mb: 2 }}>
          Back to Dashboard
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{p.customerName || 'Customer'}</Typography>
              {p.tier && <Chip label={p.tier} size="small" sx={{ bgcolor: tierColors[p.tier] || '#6B7280', color: '#fff', fontWeight: 600 }} />}
              {p.segment && <Chip label={(p.segment || '').replace('_', ' ')} size="small" sx={{ bgcolor: segmentColors[p.segment] || '#6B7280', color: '#fff' }} />}
              <Chip label={p.status || 'active'} size="small" color={p.status === 'active' ? 'success' : 'default'} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {p.customerCode} {p.channel && `• ${p.channel}`} {p.region && `• ${p.region}`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={() => handleRecalculate(p.id)}>Recalculate</Button>
            <Button variant="outlined" size="small" startIcon={<Edit />} onClick={() => handleEdit(p)}>Edit</Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[
            { label: 'Total Revenue', value: formatCurrency(p.totalRevenue), icon: <AttachMoney />, color: '#10B981' },
            { label: 'Net Revenue', value: formatCurrency(p.netRevenue), icon: <TrendingUp />, color: '#3B82F6' },
            { label: 'Trade Spend %', value: `${(p.tradeSpendPct || 0).toFixed(1)}%`, icon: <BarChart />, color: '#F59E0B' },
            { label: 'Health Score', value: `${Math.round(p.healthScore || 0)}/100`, icon: <Speed />, color: p.healthScore >= 60 ? '#10B981' : '#EF4444' },
            { label: 'LTV Score', value: formatCurrency(p.ltvScore), icon: <Star />, color: '#7C3AED' },
            { label: 'Churn Risk', value: `${((p.churnRisk || 0) * 100).toFixed(0)}%`, icon: <Warning />, color: (p.churnRisk || 0) > 0.5 ? '#EF4444' : '#F59E0B' },
          ].map((card, i) => (
            <Grid item xs={12} sm={6} md={2} key={i}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: 3, borderColor: card.color }}>
                <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{card.value}</Typography>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>AI Insights</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Segment', value: (p.segment || 'N/A').replace('_', ' ') },
                  { label: 'Price Sensitivity', value: `${((p.priceSensitivity || 0) * 100).toFixed(0)}%` },
                  { label: 'Promo Responsiveness', value: `${((p.promoResponsiveness || 0) * 100).toFixed(0)}%` },
                  { label: 'Payment Reliability', value: `${((p.paymentReliability || 0) * 100).toFixed(0)}%` },
                  { label: 'Satisfaction', value: `${Math.round(p.satisfactionScore || 0)}/100` },
                  { label: 'Engagement', value: `${Math.round(p.engagementScore || 0)}/100` },
                ].map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
              {p.nextBestAction && (
                <Alert severity="info" icon={<Lightbulb />} sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Next Best Action</Typography>
                  <Typography variant="body2">{p.nextBestAction}</Typography>
                </Alert>
              )}
              {p.churnReason && (
                <Alert severity={(p.churnRisk || 0) > 0.5 ? 'error' : 'warning'} sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>Churn Risk Reason</Typography>
                  <Typography variant="body2">{p.churnReason}</Typography>
                </Alert>
              )}
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Activity Summary</Typography>
              {[
                { label: 'Active Promotions', value: p.activePromotions || 0 },
                { label: 'Completed Promotions', value: p.completedPromotions || 0 },
                { label: 'Active Claims', value: p.activeClaims || 0 },
                { label: 'Pending Deductions', value: p.pendingDeductions || 0 },
                { label: 'Order Frequency', value: `${p.orderFrequency || 0}/yr` },
                { label: 'Avg Order Value', value: formatCurrency(p.avgOrderValue) },
                { label: 'Revenue Growth', value: `${(p.revenueGrowthPct || 0).toFixed(1)}%` },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #F3F4F6' }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Top Products</Typography>
              {topProducts.length > 0 ? topProducts.map((prod, i) => (
                <Box key={i} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{prod.name || `Product ${i + 1}`}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(prod.revenue)}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min(100, (prod.share || 0) * 100)} sx={{ height: 6, borderRadius: 3, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED', borderRadius: 3 } }} />
                </Box>
              )) : <Typography variant="body2" color="text.secondary">No product data available</Typography>}
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Monthly Revenue Trend</Typography>
              {monthlyRevenue.length > 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 120 }}>
                  {monthlyRevenue.map((m, i) => {
                    const maxVal = Math.max(...monthlyRevenue.map(r => r.value || r));
                    const val = m.value || m;
                    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                    return (
                      <Tooltip key={i} title={`${m.label || `Month ${i + 1}`}: ${formatCurrency(val)}`}>
                        <Box sx={{ flex: 1, height: `${pct}%`, bgcolor: '#7C3AED', borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height 0.3s ease', '&:hover': { bgcolor: '#6D28D9' } }} />
                      </Tooltip>
                    );
                  })}
                </Box>
              ) : <Typography variant="body2" color="text.secondary">No monthly data available</Typography>}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Insights & Alerts</Typography>
              {insights.length > 0 ? insights.map((insight, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1, borderLeft: 3, borderColor: severityColors[insight.severity] || '#6B7280' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{insight.title}</Typography>
                    <Chip label={insight.severity} size="small" sx={{ bgcolor: severityColors[insight.severity], color: '#fff', height: 20, fontSize: '0.65rem' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">{insight.description}</Typography>
                  {insight.recommendation && (
                    <Box sx={{ mt: 0.5, p: 0.5, bgcolor: '#F0FDF4', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#166534' }}>{insight.recommendation}</Typography>
                    </Box>
                  )}
                </Paper>
              )) : <Typography variant="body2" color="text.secondary">No insights available for this customer</Typography>}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Customer 360</Typography>
          <Typography variant="body2" color="text.secondary">Comprehensive customer profiles with AI insights</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => { loadSummary(); loadProfiles(); loadAtRisk(); loadLeaderboard(); }}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>Add Profile</Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Customers', value: summary.totalCustomers, icon: <Person />, color: '#7C3AED' },
            { label: 'Active', value: summary.activeCustomers, icon: <ThumbUp />, color: '#10B981' },
            { label: 'At Risk', value: summary.atRiskCustomers, icon: <Warning />, color: '#EF4444' },
            { label: 'Avg Health', value: `${summary.avgHealthScore}/100`, icon: <Speed />, color: '#3B82F6' },
            { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue), icon: <AttachMoney />, color: '#F59E0B' },
            { label: 'Total Spend', value: formatCurrency(summary.totalSpend), icon: <BarChart />, color: '#6B7280' },
          ].map((card, i) => (
            <Grid item xs={12} sm={6} md={2} key={i}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: 3, borderColor: card.color }}>
                <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{card.value}</Typography>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab label="All Profiles" />
          <Tab label="At-Risk Customers" />
          <Tab label="Leaderboard" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField size="small" placeholder="Search customers..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ flex: 1 }} />
            <TextField select size="small" value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(0); }} sx={{ minWidth: 120 }} label="Tier">
              <MenuItem value="">All Tiers</MenuItem>
              {['platinum', 'gold', 'silver', 'bronze'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
            </TextField>
            <TextField select size="small" value={segmentFilter} onChange={(e) => { setSegmentFilter(e.target.value); setPage(0); }} sx={{ minWidth: 140 }} label="Segment">
              <MenuItem value="">All Segments</MenuItem>
              {['strategic', 'key_account', 'growth', 'maintain', 'at_risk'].map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
            </TextField>
            <TextField select size="small" value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ minWidth: 140 }} label="Sort By">
              {[{ v: 'total_revenue', l: 'Revenue' }, { v: 'health_score', l: 'Health Score' }, { v: 'churn_risk', l: 'Churn Risk' }, { v: 'ltv_score', l: 'LTV' }, { v: 'revenue_growth_pct', l: 'Growth %' }].map(o =>
                <MenuItem key={o.v} value={o.v}>{o.l}</MenuItem>
              )}
            </TextField>
          </Box>

          {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tier</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Segment</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Revenue</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Spend %</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Health</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Churn Risk</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Growth</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No customer profiles found</Typography></TableCell></TableRow>
                  ) : profiles.map((p) => (
                    <TableRow key={p.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } }}>
                      <TableCell onClick={() => handleViewProfile(p)}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.customerName}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.customerCode} {p.channel && `• ${p.channel}`}</Typography>
                      </TableCell>
                      <TableCell>{p.tier && <Chip label={p.tier} size="small" sx={{ bgcolor: tierColors[p.tier] || '#6B7280', color: '#fff', fontWeight: 600, height: 22, fontSize: '0.7rem' }} />}</TableCell>
                      <TableCell>{p.segment && <Chip label={(p.segment || '').replace('_', ' ')} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />}</TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(p.totalRevenue)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2">{(p.tradeSpendPct || 0).toFixed(1)}%</Typography></TableCell>
                      <TableCell sx={{ minWidth: 120 }}><HealthBar score={p.healthScore || 0} /></TableCell>
                      <TableCell align="right">
                        <Chip label={`${((p.churnRisk || 0) * 100).toFixed(0)}%`} size="small"
                          sx={{ bgcolor: (p.churnRisk || 0) > 0.5 ? '#FEE2E2' : (p.churnRisk || 0) > 0.3 ? '#FEF3C7' : '#F0FDF4',
                            color: (p.churnRisk || 0) > 0.5 ? '#991B1B' : (p.churnRisk || 0) > 0.3 ? '#92400E' : '#166534', height: 22, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {(p.revenueGrowthPct || 0) >= 0 ? <TrendingUp sx={{ fontSize: 16, color: '#10B981' }} /> : <TrendingDown sx={{ fontSize: 16, color: '#EF4444' }} />}
                          <Typography variant="body2" sx={{ color: (p.revenueGrowthPct || 0) >= 0 ? '#10B981' : '#EF4444' }}>{(p.revenueGrowthPct || 0).toFixed(1)}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="View"><IconButton size="small" onClick={() => handleViewProfile(p)}><Visibility fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(p.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
            </TableContainer>
          )}
        </>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {atRiskCustomers.length === 0 ? (
            <Grid item xs={12}><Alert severity="success">No at-risk customers detected</Alert></Grid>
          ) : atRiskCustomers.map((p) => (
            <Grid item xs={12} md={6} lg={4} key={p.id}>
              <Paper sx={{ p: 2, borderLeft: 4, borderColor: (p.churnRisk || 0) > 0.7 ? '#EF4444' : '#F59E0B', cursor: 'pointer', '&:hover': { boxShadow: 2 } }} onClick={() => handleViewProfile(p)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{p.customerName}</Typography>
                  <Chip label={`${((p.churnRisk || 0) * 100).toFixed(0)}% Risk`} size="small" sx={{ bgcolor: (p.churnRisk || 0) > 0.7 ? '#FEE2E2' : '#FEF3C7', color: (p.churnRisk || 0) > 0.7 ? '#991B1B' : '#92400E' }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{p.churnReason || 'Risk factors detected'}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">Revenue: {formatCurrency(p.totalRevenue)}</Typography>
                  <Typography variant="caption">Health: {Math.round(p.healthScore || 0)}/100</Typography>
                </Box>
                {p.nextBestAction && (
                  <Alert severity="info" icon={<Lightbulb sx={{ fontSize: 16 }} />} sx={{ mt: 1, py: 0 }}>
                    <Typography variant="caption">{p.nextBestAction}</Typography>
                  </Alert>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tier</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Revenue</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Health</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Growth</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">LTV</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((p, i) => (
                <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewProfile(p)}>
                  <TableCell><Chip label={`#${i + 1}`} size="small" sx={{ bgcolor: i < 3 ? '#FEF3C7' : '#F3F4F6', fontWeight: 700 }} /></TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.channel}</Typography>
                  </TableCell>
                  <TableCell>{p.tier && <Chip label={p.tier} size="small" sx={{ bgcolor: tierColors[p.tier] || '#6B7280', color: '#fff', height: 22, fontSize: '0.7rem' }} />}</TableCell>
                  <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(p.totalRevenue)}</Typography></TableCell>
                  <TableCell sx={{ minWidth: 120 }}><HealthBar score={p.healthScore || 0} /></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: (p.revenueGrowthPct || 0) >= 0 ? '#10B981' : '#EF4444' }}>
                      {(p.revenueGrowthPct || 0) >= 0 ? '+' : ''}{(p.revenueGrowthPct || 0).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="right"><Typography variant="body2">{formatCurrency(p.ltvScore)}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Add Customer 360 Profile' : 'Edit Customer 360 Profile'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Customer Name" value={formData.customerName || ''} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Customer Code" value={formData.customerCode || ''} onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Channel" value={formData.channel || ''} onChange={(e) => setFormData({ ...formData, channel: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select size="small" label="Tier" value={formData.tier || 'bronze'} onChange={(e) => setFormData({ ...formData, tier: e.target.value })}>
                {['platinum', 'gold', 'silver', 'bronze'].map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select size="small" label="Segment" value={formData.segment || 'maintain'} onChange={(e) => setFormData({ ...formData, segment: e.target.value })}>
                {['strategic', 'key_account', 'growth', 'maintain', 'at_risk'].map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Region" value={formData.region || ''} onChange={(e) => setFormData({ ...formData, region: e.target.value })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Total Revenue" type="number" value={formData.totalRevenue || ''} onChange={(e) => setFormData({ ...formData, totalRevenue: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Total Spend" type="number" value={formData.totalSpend || ''} onChange={(e) => setFormData({ ...formData, totalSpend: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="LTV Score" type="number" value={formData.ltvScore || ''} onChange={(e) => setFormData({ ...formData, ltvScore: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Churn Risk (0-1)" type="number" inputProps={{ min: 0, max: 1, step: 0.01 }} value={formData.churnRisk || ''} onChange={(e) => setFormData({ ...formData, churnRisk: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Health Score (0-100)" type="number" inputProps={{ min: 0, max: 100 }} value={formData.healthScore || ''} onChange={(e) => setFormData({ ...formData, healthScore: parseFloat(e.target.value) || 0 })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Next Best Action" value={formData.nextBestAction || ''} onChange={(e) => setFormData({ ...formData, nextBestAction: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Churn Reason" value={formData.churnReason || ''} onChange={(e) => setFormData({ ...formData, churnReason: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Notes" multiline rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {dialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customer360Dashboard;
