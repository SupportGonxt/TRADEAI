import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Snackbar, Tooltip,
  LinearProgress, TableSortLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Sensors as SignalIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Warning as WarningIcon,
  Visibility as ViewIcon,
  TrendingFlat as StableIcon,
} from '@mui/icons-material';
import { demandSignalService, customerService, productService, promotionService } from '../../services/api';

const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  if (num >= 1000000) return `R${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `R${(num / 1000).toFixed(0)}K`;
  return `R${num.toFixed(0)}`;
};

const formatNumber = (value) => {
  const num = parseFloat(value) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toFixed(0);
};

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
};

const SummaryCard = ({ title, value, subtitle, icon, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mt: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}15` }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const TrendIcon = ({ direction }) => {
  if (direction === 'up') return <TrendUpIcon sx={{ color: '#059669', fontSize: 16 }} />;
  if (direction === 'down') return <TrendDownIcon sx={{ color: '#DC2626', fontSize: 16 }} />;
  return <StableIcon sx={{ color: '#6B7280', fontSize: 16 }} />;
};

const EMPTY_SIGNAL = {
  signalType: 'pos_sales', signalDate: '', granularity: 'weekly',
  customerId: '', customerName: '', productId: '', productName: '',
  category: '', brand: '', channel: '', region: '',
  storeId: '', storeName: '', sourceId: '', sourceName: '',
  unitsSold: 0, revenue: 0, volume: 0, avgPrice: 0,
  baselineUnits: 0, baselineRevenue: 0, incrementalUnits: 0, incrementalRevenue: 0, liftPct: 0,
  promoFlag: false, promotionId: '',
  inventoryLevel: 0, outOfStockFlag: false, distributionPct: 0,
  priceIndex: 0, competitorPrice: 0, marketSharePct: 0,
  weatherCondition: '', temperature: '', sentimentScore: '',
  trendDirection: '', confidence: 0, anomalyFlag: false, anomalyType: '', notes: '',
};

const EMPTY_SOURCE = {
  name: '', description: '', sourceType: 'pos', provider: '', frequency: 'weekly', status: 'active',
};

const DemandSignalManagement = () => {
  const [tab, setTab] = useState(0);
  const [signals, setSignals] = useState([]);
  const [sources, setSources] = useState([]);
  const [trends, setTrends] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const [signalDialog, setSignalDialog] = useState(false);
  const [signalForm, setSignalForm] = useState(EMPTY_SIGNAL);
  const [editingSignalId, setEditingSignalId] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [detailSignal, setDetailSignal] = useState(null);

  const [sourceDialog, setSourceDialog] = useState(false);
  const [sourceForm, setSourceForm] = useState(EMPTY_SOURCE);
  const [editingSourceId, setEditingSourceId] = useState(null);

  const [sortField, setSortField] = useState('signal_date');
  const [sortDir, setSortDir] = useState('desc');

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await demandSignalService.getAll();
      setSignals(res.data || []);
    } catch (e) {
      showSnack(e.message || 'Failed to load signals', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const res = await demandSignalService.getSources();
      setSources(res.data || []);
    } catch (e) {
      showSnack(e.message || 'Failed to load sources', 'error');
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await demandSignalService.getSummary();
      setSummary(res.data || null);
    } catch (e) {
      console.error('Summary fetch error:', e);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    try {
      const res = await demandSignalService.getTrends({ granularity: 'monthly' });
      setTrends(res.data || []);
    } catch (e) {
      console.error('Trends fetch error:', e);
    }
  }, []);

  const fetchAnomalies = useCallback(async () => {
    try {
      const res = await demandSignalService.getAnomalies();
      setAnomalies(res.data || []);
    } catch (e) {
      console.error('Anomalies fetch error:', e);
    }
  }, []);

  const fetchRefData = useCallback(async () => {
    try {
      const [optRes, custRes, prodRes, promoRes] = await Promise.all([
        demandSignalService.getOptions(),
        customerService.getAll({ limit: 500 }),
        productService.getAll({ limit: 500 }),
        promotionService.getAll({ limit: 500 }),
      ]);
      setOptions(optRes.data || null);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
      setPromotions(promoRes.data || []);
    } catch (e) {
      console.error('Ref data fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    fetchSources();
    fetchSummary();
    fetchTrends();
    fetchAnomalies();
    fetchRefData();
  }, [fetchSignals, fetchSources, fetchSummary, fetchTrends, fetchAnomalies, fetchRefData]);

  const handleCreateSignal = () => {
    setSignalForm(EMPTY_SIGNAL);
    setEditingSignalId(null);
    setSignalDialog(true);
  };

  const handleEditSignal = (sig) => {
    setSignalForm({
      signalType: sig.signalType || sig.signal_type || 'pos_sales',
      signalDate: (sig.signalDate || sig.signal_date || '').split('T')[0],
      granularity: sig.granularity || 'weekly',
      customerId: sig.customerId || sig.customer_id || '',
      customerName: sig.customerName || sig.customer_name || '',
      productId: sig.productId || sig.product_id || '',
      productName: sig.productName || sig.product_name || '',
      category: sig.category || '',
      brand: sig.brand || '',
      channel: sig.channel || '',
      region: sig.region || '',
      storeId: sig.storeId || sig.store_id || '',
      storeName: sig.storeName || sig.store_name || '',
      sourceId: sig.sourceId || sig.source_id || '',
      sourceName: sig.sourceName || sig.source_name || '',
      unitsSold: sig.unitsSold || sig.units_sold || 0,
      revenue: sig.revenue || 0,
      volume: sig.volume || 0,
      avgPrice: sig.avgPrice || sig.avg_price || 0,
      baselineUnits: sig.baselineUnits || sig.baseline_units || 0,
      baselineRevenue: sig.baselineRevenue || sig.baseline_revenue || 0,
      incrementalUnits: sig.incrementalUnits || sig.incremental_units || 0,
      incrementalRevenue: sig.incrementalRevenue || sig.incremental_revenue || 0,
      liftPct: sig.liftPct || sig.lift_pct || 0,
      promoFlag: sig.promoFlag || sig.promo_flag || false,
      promotionId: sig.promotionId || sig.promotion_id || '',
      inventoryLevel: sig.inventoryLevel || sig.inventory_level || 0,
      outOfStockFlag: sig.outOfStockFlag || sig.out_of_stock_flag || false,
      distributionPct: sig.distributionPct || sig.distribution_pct || 0,
      priceIndex: sig.priceIndex || sig.price_index || 0,
      competitorPrice: sig.competitorPrice || sig.competitor_price || 0,
      marketSharePct: sig.marketSharePct || sig.market_share_pct || 0,
      weatherCondition: sig.weatherCondition || sig.weather_condition || '',
      temperature: sig.temperature || '',
      sentimentScore: sig.sentimentScore || sig.sentiment_score || '',
      trendDirection: sig.trendDirection || sig.trend_direction || '',
      confidence: sig.confidence || 0,
      anomalyFlag: sig.anomalyFlag || sig.anomaly_flag || false,
      anomalyType: sig.anomalyType || sig.anomaly_type || '',
      notes: sig.notes || '',
    });
    setEditingSignalId(sig.id);
    setSignalDialog(true);
  };

  const handleSaveSignal = async () => {
    try {
      if (editingSignalId) {
        await demandSignalService.update(editingSignalId, signalForm);
        showSnack('Signal updated');
      } else {
        await demandSignalService.create(signalForm);
        showSnack('Signal created');
      }
      setSignalDialog(false);
      fetchSignals();
      fetchSummary();
      fetchTrends();
      fetchAnomalies();
    } catch (e) {
      showSnack(e.message || 'Save failed', 'error');
    }
  };

  const handleDeleteSignal = async (id) => {
    if (!window.confirm('Delete this demand signal?')) return;
    try {
      await demandSignalService.delete(id);
      showSnack('Signal deleted');
      fetchSignals();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Delete failed', 'error');
    }
  };

  const handleViewDetail = async (sig) => {
    try {
      const res = await demandSignalService.getById(sig.id);
      setDetailSignal(res.data || sig);
      setDetailDialog(true);
    } catch {
      setDetailSignal(sig);
      setDetailDialog(true);
    }
  };

  const handleCreateSource = () => {
    setSourceForm(EMPTY_SOURCE);
    setEditingSourceId(null);
    setSourceDialog(true);
  };

  const handleEditSource = (src) => {
    setSourceForm({
      name: src.name || '',
      description: src.description || '',
      sourceType: src.sourceType || src.source_type || 'pos',
      provider: src.provider || '',
      frequency: src.frequency || 'weekly',
      status: src.status || 'active',
    });
    setEditingSourceId(src.id);
    setSourceDialog(true);
  };

  const handleSaveSource = async () => {
    try {
      if (editingSourceId) {
        await demandSignalService.updateSource(editingSourceId, sourceForm);
        showSnack('Source updated');
      } else {
        await demandSignalService.createSource(sourceForm);
        showSnack('Source created');
      }
      setSourceDialog(false);
      fetchSources();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Save failed', 'error');
    }
  };

  const handleDeleteSource = async (id) => {
    if (!window.confirm('Delete this data source?')) return;
    try {
      await demandSignalService.deleteSource(id);
      showSnack('Source deleted');
      fetchSources();
      fetchSummary();
    } catch (e) {
      showSnack(e.message || 'Delete failed', 'error');
    }
  };

  const handleCustomerSelect = (id) => {
    const cust = customers.find(c => c.id === id);
    setSignalForm(prev => ({ ...prev, customerId: id, customerName: cust?.name || '' }));
  };

  const handleProductSelect = (id) => {
    const prod = products.find(p => p.id === id);
    setSignalForm(prev => ({ ...prev, productId: id, productName: prod?.name || '' }));
  };

  const handleSourceSelect = (id) => {
    const src = sources.find(s => s.id === id);
    setSignalForm(prev => ({ ...prev, sourceId: id, sourceName: src?.name || '' }));
  };

  const handleSort = (field) => {
    setSortDir(sortField === field && sortDir === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedSignals = [...signals].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  const signalTypes = options?.signalTypes || [];
  const sourceTypes = options?.sourceTypes || [];
  const frequencies = options?.frequencies || [];
  const granularities = options?.granularities || [];
  const trendDirections = options?.trendDirections || [];
  const anomalyTypes = options?.anomalyTypes || [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
            Demand Signal Repository
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>
            Capture and analyze external demand signals — POS data, market trends, weather, sentiment
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { fetchSignals(); fetchSources(); fetchSummary(); fetchTrends(); fetchAnomalies(); }}
            sx={{ borderColor: '#E5E7EB', color: '#374151', '&:hover': { borderColor: '#7C3AED', color: '#7C3AED' } }}>
            Refresh
          </Button>
          {tab === 0 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSignal}
              sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
              New Signal
            </Button>
          )}
          {tab === 3 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSource}
              sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
              New Source
            </Button>
          )}
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Total Signals" value={formatNumber(summary?.signals?.total)}
            subtitle={`${summary?.signals?.sourceCount || 0} sources`}
            icon={<SignalIcon />} color="#7C3AED" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Total Revenue" value={formatCurrency(summary?.signals?.totalRevenue)}
            subtitle={`${formatNumber(summary?.signals?.totalUnits)} units`}
            icon={<TrendUpIcon />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Incremental Revenue" value={formatCurrency(summary?.signals?.totalIncrementalRevenue)}
            subtitle={`Avg lift: ${summary?.signals?.avgLift || 0}%`}
            icon={<TrendUpIcon />} color="#2563EB" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Anomalies" value={summary?.signals?.anomalyCount || 0}
            subtitle={`${summary?.signals?.oosCount || 0} out-of-stock`}
            icon={<WarningIcon />} color="#DC2626" />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#7C3AED' }, '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
        <Tab label={`Signals (${signals.length})`} />
        <Tab label="Trends" />
        <Tab label={`Anomalies (${anomalies.length})`} />
        <Tab label={`Sources (${sources.length})`} />
      </Tabs>

      {/* TAB 0: Signals */}
      {tab === 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>
                  <TableSortLabel active={sortField === 'signal_date'} direction={sortField === 'signal_date' ? sortDir : 'desc'} onClick={() => handleSort('signal_date')}>Date</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Units</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Revenue</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Lift %</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Trend</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSignals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                    No demand signals yet. Click "New Signal" to add one.
                  </TableCell>
                </TableRow>
              ) : sortedSignals.map((sig) => {
                const typeInfo = signalTypes.find(t => t.value === (sig.signalType || sig.signal_type));
                const isAnomaly = sig.anomalyFlag || sig.anomaly_flag;
                return (
                  <TableRow key={sig.id} hover sx={{ bgcolor: isAnomaly ? '#FEF2F2' : 'inherit' }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDate(sig.signalDate || sig.signal_date)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{sig.granularity}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={typeInfo?.label || (sig.signalType || sig.signal_type)} size="small"
                        sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 500, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{sig.customerName || sig.customer_name || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{sig.productName || sig.product_name || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatNumber(sig.unitsSold || sig.units_sold)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(sig.revenue)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: (sig.liftPct || sig.lift_pct || 0) > 0 ? '#059669' : '#DC2626' }}>
                        {(sig.liftPct || sig.lift_pct || 0).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendIcon direction={sig.trendDirection || sig.trend_direction} />
                        {isAnomaly && <Chip label="Anomaly" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontSize: '0.65rem' }} />}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View"><IconButton size="small" onClick={() => handleViewDetail(sig)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditSignal(sig)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteSignal(sig.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 1: Trends */}
      {tab === 1 && (
        <Box>
          {trends.length === 0 ? (
            <Card sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No trend data available yet</Typography>
            </Card>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Period</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Units</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Revenue</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Baseline Revenue</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Incremental Revenue</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Avg Lift %</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Market Share %</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Anomalies</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trends.map((t, i) => (
                    <TableRow key={i} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{t.period}</Typography></TableCell>
                      <TableCell align="right">{formatNumber(t.units)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(t.revenue)}</TableCell>
                      <TableCell align="right">{formatCurrency(t.baselineRevenue)}</TableCell>
                      <TableCell align="right" sx={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(t.incrementalRevenue)}</TableCell>
                      <TableCell align="right" sx={{ color: t.avgLift > 0 ? '#059669' : '#DC2626' }}>{t.avgLift}%</TableCell>
                      <TableCell align="right">{t.avgMarketShare}%</TableCell>
                      <TableCell align="right">
                        {t.anomalies > 0 ? <Chip label={t.anomalies} size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626' }} /> : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* TAB 2: Anomalies */}
      {tab === 2 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#FEF2F2' }}>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Anomaly Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Revenue</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Lift %</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {anomalies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                    No anomalies detected
                  </TableCell>
                </TableRow>
              ) : anomalies.map((a) => {
                const aTypeInfo = anomalyTypes.find(t => t.value === (a.anomalyType || a.anomaly_type));
                return (
                  <TableRow key={a.id} hover sx={{ bgcolor: '#FEF2F2' }}>
                    <TableCell>{formatDate(a.signalDate || a.signal_date)}</TableCell>
                    <TableCell>
                      <Chip label={a.signalType || a.signal_type} size="small" sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>{a.customerName || a.customer_name || '-'}</TableCell>
                    <TableCell>{a.productName || a.product_name || '-'}</TableCell>
                    <TableCell>
                      <Chip label={aTypeInfo?.label || (a.anomalyType || a.anomaly_type || 'Unknown')} size="small"
                        sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 500, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(a.revenue)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: (a.liftPct || a.lift_pct || 0) > 0 ? '#059669' : '#DC2626' }}>
                      {(a.liftPct || a.lift_pct || 0).toFixed(1)}%
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View"><IconButton size="small" onClick={() => handleViewDetail(a)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditSignal(a)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* TAB 3: Sources */}
      {tab === 3 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Frequency</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right">Records</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                    No data sources defined. Click "New Source" to add one.
                  </TableCell>
                </TableRow>
              ) : sources.map((src) => {
                const stInfo = sourceTypes.find(t => t.value === (src.sourceType || src.source_type));
                return (
                  <TableRow key={src.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{src.name}</Typography>
                      {src.description && <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{src.description}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip label={stInfo?.label || (src.sourceType || src.source_type)} size="small"
                        sx={{ bgcolor: '#DBEAFE', color: '#2563EB', fontWeight: 500, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>{src.provider || '-'}</TableCell>
                    <TableCell>{src.frequency}</TableCell>
                    <TableCell>
                      <Chip label={src.status} size="small"
                        sx={{ bgcolor: src.status === 'active' ? '#D1FAE5' : '#F3F4F6', color: src.status === 'active' ? '#059669' : '#6B7280', fontWeight: 600, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell align="right">{formatNumber(src.recordCount || src.record_count)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditSource(src)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteSource(src.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Signal Create/Edit Dialog */}
      <Dialog open={signalDialog} onClose={() => setSignalDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingSignalId ? 'Edit Demand Signal' : 'New Demand Signal'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth size="small" label="Signal Type"
                value={signalForm.signalType} onChange={(e) => setSignalForm(prev => ({ ...prev, signalType: e.target.value }))}>
                {signalTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size="small" label="Signal Date" type="date" InputLabelProps={{ shrink: true }} required
                value={signalForm.signalDate} onChange={(e) => setSignalForm(prev => ({ ...prev, signalDate: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField select fullWidth size="small" label="Granularity"
                value={signalForm.granularity} onChange={(e) => setSignalForm(prev => ({ ...prev, granularity: e.target.value }))}>
                {granularities.map(g => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Customer"
                value={signalForm.customerId} onChange={(e) => handleCustomerSelect(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Product"
                value={signalForm.productId} onChange={(e) => handleProductSelect(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {products.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Channel" value={signalForm.channel}
                onChange={(e) => setSignalForm(prev => ({ ...prev, channel: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Region" value={signalForm.region}
                onChange={(e) => setSignalForm(prev => ({ ...prev, region: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Category" value={signalForm.category}
                onChange={(e) => setSignalForm(prev => ({ ...prev, category: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth size="small" label="Source"
                value={signalForm.sourceId} onChange={(e) => handleSourceSelect(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {sources.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>Sales Data</Typography></Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Units Sold" type="number"
                value={signalForm.unitsSold} onChange={(e) => setSignalForm(prev => ({ ...prev, unitsSold: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Revenue (R)" type="number"
                value={signalForm.revenue} onChange={(e) => setSignalForm(prev => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Avg Price (R)" type="number"
                value={signalForm.avgPrice} onChange={(e) => setSignalForm(prev => ({ ...prev, avgPrice: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Volume" type="number"
                value={signalForm.volume} onChange={(e) => setSignalForm(prev => ({ ...prev, volume: parseFloat(e.target.value) || 0 }))} />
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>Baseline & Lift</Typography></Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Baseline Units" type="number"
                value={signalForm.baselineUnits} onChange={(e) => setSignalForm(prev => ({ ...prev, baselineUnits: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Baseline Revenue (R)" type="number"
                value={signalForm.baselineRevenue} onChange={(e) => setSignalForm(prev => ({ ...prev, baselineRevenue: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Incremental Units" type="number"
                value={signalForm.incrementalUnits} onChange={(e) => setSignalForm(prev => ({ ...prev, incrementalUnits: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Lift %" type="number"
                value={signalForm.liftPct} onChange={(e) => setSignalForm(prev => ({ ...prev, liftPct: parseFloat(e.target.value) || 0 }))} />
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>Market Intelligence</Typography></Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Market Share %" type="number"
                value={signalForm.marketSharePct} onChange={(e) => setSignalForm(prev => ({ ...prev, marketSharePct: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Competitor Price (R)" type="number"
                value={signalForm.competitorPrice} onChange={(e) => setSignalForm(prev => ({ ...prev, competitorPrice: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size="small" label="Distribution %" type="number"
                value={signalForm.distributionPct} onChange={(e) => setSignalForm(prev => ({ ...prev, distributionPct: parseFloat(e.target.value) || 0 }))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth size="small" label="Trend Direction"
                value={signalForm.trendDirection} onChange={(e) => setSignalForm(prev => ({ ...prev, trendDirection: e.target.value }))}>
                <MenuItem value="">None</MenuItem>
                {trendDirections.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Notes" multiline rows={2}
                value={signalForm.notes} onChange={(e) => setSignalForm(prev => ({ ...prev, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSignalDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSignal}
            disabled={!signalForm.signalDate}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingSignalId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Source Create/Edit Dialog */}
      <Dialog open={sourceDialog} onClose={() => setSourceDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingSourceId ? 'Edit Data Source' : 'New Data Source'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Source Name" required
                value={sourceForm.name} onChange={(e) => setSourceForm(prev => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Description" multiline rows={2}
                value={sourceForm.description} onChange={(e) => setSourceForm(prev => ({ ...prev, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Source Type"
                value={sourceForm.sourceType} onChange={(e) => setSourceForm(prev => ({ ...prev, sourceType: e.target.value }))}>
                {sourceTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Provider"
                value={sourceForm.provider} onChange={(e) => setSourceForm(prev => ({ ...prev, provider: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Frequency"
                value={sourceForm.frequency} onChange={(e) => setSourceForm(prev => ({ ...prev, frequency: e.target.value }))}>
                {frequencies.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Status"
                value={sourceForm.status} onChange={(e) => setSourceForm(prev => ({ ...prev, status: e.target.value }))}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSourceDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSource}
            disabled={!sourceForm.name}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editingSourceId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Signal Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Signal Details</DialogTitle>
        <DialogContent dividers>
          {detailSignal && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Signal Type</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {signalTypes.find(t => t.value === (detailSignal.signalType || detailSignal.signal_type))?.label || detailSignal.signalType || detailSignal.signal_type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(detailSignal.signalDate || detailSignal.signal_date)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Customer</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detailSignal.customerName || detailSignal.customer_name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Product</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{detailSignal.productName || detailSignal.product_name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Units Sold</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatNumber(detailSignal.unitsSold || detailSignal.units_sold)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Revenue</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#7C3AED' }}>{formatCurrency(detailSignal.revenue)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Baseline Revenue</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(detailSignal.baselineRevenue || detailSignal.baseline_revenue)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Incremental Revenue</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>{formatCurrency(detailSignal.incrementalRevenue || detailSignal.incremental_revenue)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Lift %</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{(detailSignal.liftPct || detailSignal.lift_pct || 0).toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Market Share</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{(detailSignal.marketSharePct || detailSignal.market_share_pct || 0).toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Competitor Price</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(detailSignal.competitorPrice || detailSignal.competitor_price)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" sx={{ color: '#6B7280' }}>Trend</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendIcon direction={detailSignal.trendDirection || detailSignal.trend_direction} />
                  <Typography variant="body2">{detailSignal.trendDirection || detailSignal.trend_direction || '-'}</Typography>
                </Box>
              </Grid>
              {(detailSignal.anomalyFlag || detailSignal.anomaly_flag) && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    Anomaly detected: {detailSignal.anomalyType || detailSignal.anomaly_type || 'Unknown'}
                  </Alert>
                </Grid>
              )}
              {detailSignal.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>Notes</Typography>
                  <Typography variant="body2">{detailSignal.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => { setDetailDialog(false); handleEditSignal(detailSignal); }}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DemandSignalManagement;
