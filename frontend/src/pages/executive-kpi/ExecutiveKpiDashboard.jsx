import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip,
  MenuItem, LinearProgress, Card, CardContent, Tooltip, Alert,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
  Speed as KpiIcon, TrackChanges as TargetIcon, Assessment as ActualIcon,
  Dashboard as ScorecardIcon, TrendingUp, TrendingDown, TrendingFlat,
  Circle as CircleIcon, Refresh as RefreshIcon, Visibility as ViewIcon,
} from '@mui/icons-material';
import { executiveKpiService } from '../../services/api';

const ragColors = { green: '#4caf50', amber: '#ff9800', red: '#f44336' };

const formatNumber = (v, decimals = 1) => {
  if (v == null) return '—';
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatPct = (v) => {
  if (v == null) return '—';
  return `${Number(v).toFixed(1)}%`;
};

const RagChip = ({ status }) => {
  const color = ragColors[status] || '#9e9e9e';
  return (
    <Chip
      icon={<CircleIcon sx={{ fontSize: 12, color }} />}
      label={status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}
      size="small"
      variant="outlined"
      sx={{ borderColor: color, color }}
    />
  );
};

const TrendIcon = ({ direction }) => {
  if (direction === 'up') return <TrendingUp sx={{ color: '#4caf50', fontSize: 18 }} />;
  if (direction === 'down') return <TrendingDown sx={{ color: '#f44336', fontSize: 18 }} />;
  return <TrendingFlat sx={{ color: '#9e9e9e', fontSize: 18 }} />;
};

const SummaryCard = ({ title, value, subtitle, icon, color = '#7c3aed' }) => (
  <Card sx={{ height: '100%', borderTop: `3px solid ${color}` }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Box sx={{ color, opacity: 0.7 }}>{icon}</Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color }}>{value}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </CardContent>
  </Card>
);

export default function ExecutiveKpiDashboard() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({});
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);

  const [definitions, setDefinitions] = useState([]);
  const [defTotal, setDefTotal] = useState(0);
  const [defPage, setDefPage] = useState(0);
  const [defSearch, setDefSearch] = useState('');

  const [targets, setTargets] = useState([]);
  const [tarTotal, setTarTotal] = useState(0);
  const [tarPage, setTarPage] = useState(0);

  const [actuals, setActuals] = useState([]);
  const [actTotal, setActTotal] = useState(0);
  const [actPage, setActPage] = useState(0);
  const [actRagFilter, setActRagFilter] = useState('');

  const [scorecards, setScorecards] = useState([]);
  const [scTotal, setScTotal] = useState(0);
  const [scPage, setScPage] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailScorecard, setDetailScorecard] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const res = await executiveKpiService.getSummary();
      if (res.success) setSummary(res.data || {});
    } catch (e) { /* ignore */ }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const res = await executiveKpiService.getOptions();
      if (res.success) setOptions(res.data || {});
    } catch (e) { /* ignore */ }
  }, []);

  const loadDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await executiveKpiService.getDefinitions({
        limit: 25, offset: defPage * 25, ...(defSearch && { search: defSearch }),
      });
      if (res.success) { setDefinitions(res.data || []); setDefTotal(res.total || 0); }
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [defPage, defSearch]);

  const loadTargets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await executiveKpiService.getTargets({ limit: 25, offset: tarPage * 25 });
      if (res.success) { setTargets(res.data || []); setTarTotal(res.total || 0); }
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [tarPage]);

  const loadActuals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await executiveKpiService.getActuals({
        limit: 25, offset: actPage * 25, ...(actRagFilter && { ragStatus: actRagFilter }),
      });
      if (res.success) { setActuals(res.data || []); setActTotal(res.total || 0); }
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [actPage, actRagFilter]);

  const loadScorecards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await executiveKpiService.getScorecards({ limit: 25, offset: scPage * 25 });
      if (res.success) { setScorecards(res.data || []); setScTotal(res.total || 0); }
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [scPage]);

  useEffect(() => { loadSummary(); loadOptions(); }, [loadSummary, loadOptions]);

  useEffect(() => {
    if (tab === 0) loadDefinitions();
    else if (tab === 1) loadTargets();
    else if (tab === 2) loadActuals();
    else if (tab === 3) loadScorecards();
  }, [tab, loadDefinitions, loadTargets, loadActuals, loadScorecards]);

  const handleCreate = (type) => {
    setDialogType(type);
    setEditItem(null);
    setForm({});
    setDialogOpen(true);
  };

  const handleEdit = (type, item) => {
    setDialogType(type);
    setEditItem(item);
    setForm({ ...item });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (dialogType === 'definition') {
        if (editItem) await executiveKpiService.updateDefinition(editItem.id, form);
        else await executiveKpiService.createDefinition(form);
        loadDefinitions();
      } else if (dialogType === 'target') {
        await executiveKpiService.createTarget(form);
        loadTargets();
      } else if (dialogType === 'actual') {
        await executiveKpiService.createActual(form);
        loadActuals();
      } else if (dialogType === 'scorecard') {
        if (editItem) await executiveKpiService.updateScorecard(editItem.id, form);
        else await executiveKpiService.createScorecard(form);
        loadScorecards();
      }
      setDialogOpen(false);
      loadSummary();
    } catch (e) { /* ignore */ }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      if (type === 'definition') { await executiveKpiService.deleteDefinition(id); loadDefinitions(); }
      else if (type === 'target') { await executiveKpiService.deleteTarget(id); loadTargets(); }
      else if (type === 'actual') { await executiveKpiService.deleteActual(id); loadActuals(); }
      else if (type === 'scorecard') { await executiveKpiService.deleteScorecard(id); loadScorecards(); }
      loadSummary();
    } catch (e) { /* ignore */ }
  };

  const handleViewScorecard = async (id) => {
    try {
      const res = await executiveKpiService.getScorecardById(id);
      if (res.success) { setDetailScorecard(res.data); setDetailOpen(true); }
    } catch (e) { /* ignore */ }
  };

  const kpiTypes = options.kpiTypes || [];
  const categories = options.categories || [];
  const frequencies = options.frequencies || [];
  const directions = options.directions || [];
  const scorecardTypes = options.scorecardTypes || [];

  const s = summary;
  const kpiStats = s.kpis || {};
  const actualsStats = s.actuals || {};
  const scorecardStats = s.scorecards || {};

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Executive KPI Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Track KPIs, set targets, monitor actuals, and build executive scorecards</Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={() => { loadSummary(); if (tab === 0) loadDefinitions(); else if (tab === 1) loadTargets(); else if (tab === 2) loadActuals(); else loadScorecards(); }}><RefreshIcon /></IconButton></Tooltip>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="KPI Definitions" value={kpiStats.total || 0} subtitle={`${kpiStats.active || 0} active`} icon={<KpiIcon />} color="#7c3aed" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Active Targets" value={s.targets?.total || 0} icon={<TargetIcon />} color="#2563eb" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="KPI Actuals" value={actualsStats.total || 0} subtitle={`Avg achievement: ${formatPct(actualsStats.avgAchievement)}`} icon={<ActualIcon />} color="#059669" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard title="Scorecards" value={scorecardStats.total || 0} subtitle={`${scorecardStats.published || 0} published · Avg score: ${formatNumber(scorecardStats.avgScore)}`} icon={<ScorecardIcon />} color="#d97706" />
        </Grid>
      </Grid>

      {actualsStats.total > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>RAG Status Overview</Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircleIcon sx={{ fontSize: 14, color: '#4caf50' }} />
              <Typography variant="body2">{actualsStats.greenCount || 0} Green</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircleIcon sx={{ fontSize: 14, color: '#ff9800' }} />
              <Typography variant="body2">{actualsStats.amberCount || 0} Amber</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircleIcon sx={{ fontSize: 14, color: '#f44336' }} />
              <Typography variant="body2">{actualsStats.redCount || 0} Red</Typography>
            </Box>
          </Box>
        </Paper>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="KPI Definitions" icon={<KpiIcon />} iconPosition="start" />
          <Tab label="Targets" icon={<TargetIcon />} iconPosition="start" />
          <Tab label="Actuals" icon={<ActualIcon />} iconPosition="start" />
          <Tab label="Scorecards" icon={<ScorecardIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <TextField size="small" placeholder="Search KPIs..." value={defSearch} onChange={(e) => { setDefSearch(e.target.value); setDefPage(0); }} sx={{ width: 300 }} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate('definition')}>Add KPI</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell align="center">Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {definitions.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography></TableCell>
                    <TableCell><Chip label={d.kpiType} size="small" /></TableCell>
                    <TableCell>{d.category}</TableCell>
                    <TableCell>{d.frequency}</TableCell>
                    <TableCell>{d.direction === 'higher_is_better' ? 'Higher' : d.direction === 'lower_is_better' ? 'Lower' : 'Target'}</TableCell>
                    <TableCell>{d.unit}</TableCell>
                    <TableCell align="center"><Chip label={d.isActive ? 'Yes' : 'No'} size="small" color={d.isActive ? 'success' : 'default'} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit('definition', d)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete('definition', d.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {definitions.length === 0 && <TableRow><TableCell colSpan={8} align="center"><Typography variant="body2" color="text.secondary">No KPI definitions found</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={defTotal} page={defPage} onPageChange={(_, p) => setDefPage(p)} rowsPerPage={25} rowsPerPageOptions={[25]} />
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate('target')}>Add Target</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>KPI</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Target</TableCell>
                  <TableCell align="right">Stretch</TableCell>
                  <TableCell align="right">Floor</TableCell>
                  <TableCell align="right">Prior Year</TableCell>
                  <TableCell align="right">Budget</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {targets.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{t.kpiName || t.kpiId}</Typography></TableCell>
                    <TableCell>{t.period}</TableCell>
                    <TableCell align="right">{formatNumber(t.targetValue)}</TableCell>
                    <TableCell align="right">{formatNumber(t.stretchTarget)}</TableCell>
                    <TableCell align="right">{formatNumber(t.floorValue)}</TableCell>
                    <TableCell align="right">{formatNumber(t.priorYearValue)}</TableCell>
                    <TableCell align="right">{formatNumber(t.budgetValue)}</TableCell>
                    <TableCell><Chip label={t.status} size="small" color={t.status === 'active' ? 'success' : 'default'} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleDelete('target', t.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {targets.length === 0 && <TableRow><TableCell colSpan={9} align="center"><Typography variant="body2" color="text.secondary">No targets found</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={tarTotal} page={tarPage} onPageChange={(_, p) => setTarPage(p)} rowsPerPage={25} rowsPerPageOptions={[25]} />
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <TextField select size="small" label="RAG Filter" value={actRagFilter} onChange={(e) => { setActRagFilter(e.target.value); setActPage(0); }} sx={{ width: 200 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="green">Green</MenuItem>
              <MenuItem value="amber">Amber</MenuItem>
              <MenuItem value="red">Red</MenuItem>
            </TextField>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate('actual')}>Record Actual</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>KPI</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Actual</TableCell>
                  <TableCell align="right">Target</TableCell>
                  <TableCell align="right">Variance</TableCell>
                  <TableCell align="right">Achievement</TableCell>
                  <TableCell>RAG</TableCell>
                  <TableCell>Trend</TableCell>
                  <TableCell align="right">YTD Actual</TableCell>
                  <TableCell align="right">YoY Growth</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {actuals.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{a.kpiName || a.kpiId}</Typography></TableCell>
                    <TableCell>{a.period}</TableCell>
                    <TableCell align="right">{formatNumber(a.actualValue)}</TableCell>
                    <TableCell align="right">{formatNumber(a.targetValue)}</TableCell>
                    <TableCell align="right" sx={{ color: a.variance >= 0 ? '#4caf50' : '#f44336' }}>{formatNumber(a.variance)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                        <LinearProgress variant="determinate" value={Math.min(a.achievementPct || 0, 100)} sx={{ width: 60, height: 6, borderRadius: 3 }} />
                        <Typography variant="caption">{formatPct(a.achievementPct)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><RagChip status={a.ragStatus} /></TableCell>
                    <TableCell><TrendIcon direction={a.trendDirection} /></TableCell>
                    <TableCell align="right">{formatNumber(a.ytdActual)}</TableCell>
                    <TableCell align="right" sx={{ color: a.yoyGrowthPct >= 0 ? '#4caf50' : '#f44336' }}>{formatPct(a.yoyGrowthPct)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleDelete('actual', a.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {actuals.length === 0 && <TableRow><TableCell colSpan={11} align="center"><Typography variant="body2" color="text.secondary">No actuals recorded</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={actTotal} page={actPage} onPageChange={(_, p) => setActPage(p)} rowsPerPage={25} rowsPerPageOptions={[25]} />
        </Paper>
      )}

      {tab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleCreate('scorecard')}>Create Scorecard</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Overall Score</TableCell>
                  <TableCell>RAG</TableCell>
                  <TableCell align="right">Financial</TableCell>
                  <TableCell align="right">Operational</TableCell>
                  <TableCell align="right">Customer</TableCell>
                  <TableCell align="right">Growth</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scorecards.map((sc) => (
                  <TableRow key={sc.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{sc.name}</Typography></TableCell>
                    <TableCell>{sc.period}</TableCell>
                    <TableCell><Chip label={sc.scorecardType} size="small" /></TableCell>
                    <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatNumber(sc.overallScore)}</Typography></TableCell>
                    <TableCell><RagChip status={sc.overallRag} /></TableCell>
                    <TableCell align="right">{formatNumber(sc.financialScore)}</TableCell>
                    <TableCell align="right">{formatNumber(sc.operationalScore)}</TableCell>
                    <TableCell align="right">{formatNumber(sc.customerScore)}</TableCell>
                    <TableCell align="right">{formatNumber(sc.growthScore)}</TableCell>
                    <TableCell><Chip label={sc.status} size="small" color={sc.status === 'published' ? 'success' : sc.status === 'draft' ? 'warning' : 'default'} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewScorecard(sc.id)}><ViewIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleEdit('scorecard', sc)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete('scorecard', sc.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {scorecards.length === 0 && <TableRow><TableCell colSpan={11} align="center"><Typography variant="body2" color="text.secondary">No scorecards found</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={scTotal} page={scPage} onPageChange={(_, p) => setScPage(p)} rowsPerPage={25} rowsPerPageOptions={[25]} />
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit' : 'Create'} {dialogType === 'definition' ? 'KPI Definition' : dialogType === 'target' ? 'KPI Target' : dialogType === 'actual' ? 'KPI Actual' : 'Scorecard'}</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {dialogType === 'definition' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Name" fullWidth value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <TextField label="Description" fullWidth multiline rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="Type" fullWidth value={form.kpiType || 'financial'} onChange={(e) => setForm({ ...form, kpiType: e.target.value })}>
                  {kpiTypes.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField select label="Category" fullWidth value={form.category || 'revenue'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="Frequency" fullWidth value={form.frequency || 'monthly'} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  {frequencies.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField select label="Direction" fullWidth value={form.direction || 'higher_is_better'} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                  {directions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Unit" fullWidth value={form.unit || 'currency'} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                <TextField label="Weight" type="number" fullWidth value={form.weight || 1} onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) })} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Red Threshold" type="number" fullWidth value={form.thresholdRed || ''} onChange={(e) => setForm({ ...form, thresholdRed: parseFloat(e.target.value) })} />
                <TextField label="Amber Threshold" type="number" fullWidth value={form.thresholdAmber || ''} onChange={(e) => setForm({ ...form, thresholdAmber: parseFloat(e.target.value) })} />
                <TextField label="Green Threshold" type="number" fullWidth value={form.thresholdGreen || ''} onChange={(e) => setForm({ ...form, thresholdGreen: parseFloat(e.target.value) })} />
              </Box>
              <TextField label="Owner" fullWidth value={form.owner || ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            </Box>
          )}

          {dialogType === 'target' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField select label="KPI" fullWidth value={form.kpiId || ''} onChange={(e) => {
                const def = definitions.find((d) => d.id === e.target.value);
                setForm({ ...form, kpiId: e.target.value, kpiName: def?.name || '' });
              }}>
                {definitions.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
              <TextField label="Period" fullWidth placeholder="e.g. 2025-Q1, 2025-01" value={form.period || ''} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Target Value" type="number" fullWidth value={form.targetValue || ''} onChange={(e) => setForm({ ...form, targetValue: parseFloat(e.target.value) })} />
                <TextField label="Stretch Target" type="number" fullWidth value={form.stretchTarget || ''} onChange={(e) => setForm({ ...form, stretchTarget: parseFloat(e.target.value) })} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Floor Value" type="number" fullWidth value={form.floorValue || ''} onChange={(e) => setForm({ ...form, floorValue: parseFloat(e.target.value) })} />
                <TextField label="Prior Year Value" type="number" fullWidth value={form.priorYearValue || ''} onChange={(e) => setForm({ ...form, priorYearValue: parseFloat(e.target.value) })} />
              </Box>
              <TextField label="Budget Value" type="number" fullWidth value={form.budgetValue || ''} onChange={(e) => setForm({ ...form, budgetValue: parseFloat(e.target.value) })} />
            </Box>
          )}

          {dialogType === 'actual' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField select label="KPI" fullWidth value={form.kpiId || ''} onChange={(e) => {
                const def = definitions.find((d) => d.id === e.target.value);
                setForm({ ...form, kpiId: e.target.value, kpiName: def?.name || '' });
              }}>
                {definitions.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
              <TextField label="Period" fullWidth placeholder="e.g. 2025-01" value={form.period || ''} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Actual Value" type="number" fullWidth value={form.actualValue || ''} onChange={(e) => setForm({ ...form, actualValue: parseFloat(e.target.value) })} />
                <TextField label="Target Value" type="number" fullWidth value={form.targetValue || ''} onChange={(e) => setForm({ ...form, targetValue: parseFloat(e.target.value) })} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="YTD Actual" type="number" fullWidth value={form.ytdActual || ''} onChange={(e) => setForm({ ...form, ytdActual: parseFloat(e.target.value) })} />
                <TextField label="YTD Target" type="number" fullWidth value={form.ytdTarget || ''} onChange={(e) => setForm({ ...form, ytdTarget: parseFloat(e.target.value) })} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="YoY Growth %" type="number" fullWidth value={form.yoyGrowthPct || ''} onChange={(e) => setForm({ ...form, yoyGrowthPct: parseFloat(e.target.value) })} />
                <TextField label="MoM Growth %" type="number" fullWidth value={form.momGrowthPct || ''} onChange={(e) => setForm({ ...form, momGrowthPct: parseFloat(e.target.value) })} />
              </Box>
              <TextField label="Prior Period Value" type="number" fullWidth value={form.priorPeriodValue || ''} onChange={(e) => setForm({ ...form, priorPeriodValue: parseFloat(e.target.value) })} />
            </Box>
          )}

          {dialogType === 'scorecard' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Name" fullWidth value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <TextField label="Description" fullWidth multiline rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Period" fullWidth placeholder="e.g. 2025-Q1" value={form.period || ''} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
                <TextField select label="Type" fullWidth value={form.scorecardType || 'monthly'} onChange={(e) => setForm({ ...form, scorecardType: e.target.value })}>
                  {scorecardTypes.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Overall Score" type="number" fullWidth value={form.overallScore || ''} onChange={(e) => setForm({ ...form, overallScore: parseFloat(e.target.value) })} />
                <TextField select label="Overall RAG" fullWidth value={form.overallRag || 'green'} onChange={(e) => setForm({ ...form, overallRag: e.target.value })}>
                  <MenuItem value="green">Green</MenuItem>
                  <MenuItem value="amber">Amber</MenuItem>
                  <MenuItem value="red">Red</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Financial Score" type="number" fullWidth value={form.financialScore || ''} onChange={(e) => setForm({ ...form, financialScore: parseFloat(e.target.value) })} />
                <TextField label="Operational Score" type="number" fullWidth value={form.operationalScore || ''} onChange={(e) => setForm({ ...form, operationalScore: parseFloat(e.target.value) })} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Customer Score" type="number" fullWidth value={form.customerScore || ''} onChange={(e) => setForm({ ...form, customerScore: parseFloat(e.target.value) })} />
                <TextField label="Growth Score" type="number" fullWidth value={form.growthScore || ''} onChange={(e) => setForm({ ...form, growthScore: parseFloat(e.target.value) })} />
              </Box>
              <TextField label="Commentary" fullWidth multiline rows={3} value={form.commentary || ''} onChange={(e) => setForm({ ...form, commentary: e.target.value })} />
              <TextField select label="Status" fullWidth value={form.status || 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        {detailScorecard && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{detailScorecard.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{detailScorecard.period} · {detailScorecard.scorecardType}</Typography>
                </Box>
                <RagChip status={detailScorecard.overallRag} />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(124,58,237,0.05)' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#7c3aed' }}>{formatNumber(detailScorecard.overallScore)}</Typography>
                    <Typography variant="caption" color="text.secondary">Overall</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>{formatNumber(detailScorecard.financialScore)}</Typography>
                    <Typography variant="caption" color="text.secondary">Financial</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>{formatNumber(detailScorecard.operationalScore)}</Typography>
                    <Typography variant="caption" color="text.secondary">Operational</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>{formatNumber(detailScorecard.customerScore)}</Typography>
                    <Typography variant="caption" color="text.secondary">Customer</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {detailScorecard.commentary && (
                <Alert severity="info" sx={{ mb: 2 }}>{detailScorecard.commentary}</Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip icon={<CircleIcon sx={{ fontSize: 12, color: '#4caf50' }} />} label={`${detailScorecard.greenCount || 0} Green`} size="small" />
                <Chip icon={<CircleIcon sx={{ fontSize: 12, color: '#ff9800' }} />} label={`${detailScorecard.amberCount || 0} Amber`} size="small" />
                <Chip icon={<CircleIcon sx={{ fontSize: 12, color: '#f44336' }} />} label={`${detailScorecard.redCount || 0} Red`} size="small" />
              </Box>

              {detailScorecard.kpiActuals?.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>KPI Performance</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>KPI</TableCell>
                          <TableCell align="right">Actual</TableCell>
                          <TableCell align="right">Target</TableCell>
                          <TableCell align="right">Achievement</TableCell>
                          <TableCell>RAG</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailScorecard.kpiActuals.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>{a.kpiName || a.kpiId}</TableCell>
                            <TableCell align="right">{formatNumber(a.actualValue)}</TableCell>
                            <TableCell align="right">{formatNumber(a.targetValue)}</TableCell>
                            <TableCell align="right">{formatPct(a.achievementPct)}</TableCell>
                            <TableCell><RagChip status={a.ragStatus} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
