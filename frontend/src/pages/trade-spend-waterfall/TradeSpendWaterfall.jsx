import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, LinearProgress, Alert, Snackbar,
  alpha
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, ShowChart as WaterfallIcon,
  BarChart as ChartIcon, PieChart as DecompIcon, Assessment as AnalysisIcon
} from '@mui/icons-material';
import { tradeSpendWaterfallService } from '../../services/api';

const STEP_COLORS = { addition: '#10B981', deduction: '#EF4444', subtotal: '#3B82F6', net: '#8B5CF6' };

const SummaryCard = ({ title, value, subtitle, icon, color }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
        </Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>{value}</Typography>
      <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>{title}</Typography>
      {subtitle && <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{subtitle}</Typography>}
    </CardContent>
  </Card>
);

const emptyAnalysis = {
  name: '', description: '', analysisType: 'trade_spend', period: '', periodStart: '', periodEnd: '',
  dimension: 'overall', dimensionName: '', baseRevenue: '', grossRevenue: '', netRevenue: '',
  totalTradeSpend: '', currency: 'ZAR', status: 'draft', notes: ''
};

const emptyStep = {
  analysisId: '', stepOrder: 0, stepType: 'deduction', label: '', description: '',
  amount: '', percentage: '', startValue: '', endValue: '', color: '#EF4444',
  category: '', source: '', isSubtotal: false, notes: ''
};

const emptyDecomp = {
  name: '', spendType: 'trade_promotion', category: '', customerName: '', productName: '',
  channel: '', region: '', grossAmount: '', netAmount: '', pctOfTotal: '', pctOfRevenue: '',
  roi: '', volumeImpact: '', effectivenessScore: '', notes: ''
};

export default function TradeSpendWaterfall() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [analyses, setAnalyses] = useState([]);
  const [steps, setSteps] = useState([]);
  const [decompositions, setDecompositions] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('analysis');
  const [editData, setEditData] = useState(emptyAnalysis);
  const [editId, setEditId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showMsg = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, anlRes] = await Promise.all([
        tradeSpendWaterfallService.getSummary().catch(() => ({ data: {} })),
        tradeSpendWaterfallService.getAnalyses({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data || sumRes);
      setAnalyses(anlRes.data || []);

      if (selectedAnalysis) {
        const [stpRes, decRes] = await Promise.all([
          tradeSpendWaterfallService.getSteps({ analysisId: selectedAnalysis }).catch(() => ({ data: [] })),
          tradeSpendWaterfallService.getDecompositions({ analysisId: selectedAnalysis }).catch(() => ({ data: [] })),
        ]);
        setSteps(stpRes.data || []);
        setDecompositions(decRes.data || []);
      }
    } catch (e) {
      showMsg('Failed to load data', 'error');
    }
    setLoading(false);
  }, [selectedAnalysis]);

  useEffect(() => { loadData(); }, [loadData]);

  const openDialog = (type, data, id) => {
    setDialogType(type);
    setEditData(data || (type === 'analysis' ? emptyAnalysis : type === 'step' ? { ...emptyStep, analysisId: selectedAnalysis } : emptyDecomp));
    setEditId(id || null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (dialogType === 'analysis') {
        const payload = { ...editData, baseRevenue: parseFloat(editData.baseRevenue) || 0, grossRevenue: parseFloat(editData.grossRevenue) || 0, netRevenue: parseFloat(editData.netRevenue) || 0, totalTradeSpend: parseFloat(editData.totalTradeSpend) || 0 };
        if (editId) { await tradeSpendWaterfallService.updateAnalysis(editId, payload); }
        else { await tradeSpendWaterfallService.createAnalysis(payload); }
      } else if (dialogType === 'step') {
        const payload = { ...editData, amount: parseFloat(editData.amount) || 0, percentage: parseFloat(editData.percentage) || 0, startValue: parseFloat(editData.startValue) || 0, endValue: parseFloat(editData.endValue) || 0, stepOrder: parseInt(editData.stepOrder) || 0 };
        await tradeSpendWaterfallService.createStep(payload);
      } else {
        const payload = { ...editData, analysisId: selectedAnalysis, grossAmount: parseFloat(editData.grossAmount) || 0, netAmount: parseFloat(editData.netAmount) || 0, pctOfTotal: parseFloat(editData.pctOfTotal) || 0, pctOfRevenue: parseFloat(editData.pctOfRevenue) || 0, roi: parseFloat(editData.roi) || 0, volumeImpact: parseFloat(editData.volumeImpact) || 0, effectivenessScore: parseFloat(editData.effectivenessScore) || 0 };
        await tradeSpendWaterfallService.createDecomposition(payload);
      }
      showMsg(`${dialogType === 'analysis' ? 'Analysis' : dialogType === 'step' ? 'Step' : 'Decomposition'} saved`);
      setDialogOpen(false);
      loadData();
    } catch (e) {
      showMsg(e.response?.data?.error || 'Save failed', 'error');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete this ${type}?`)) return;
    try {
      if (type === 'analysis') await tradeSpendWaterfallService.deleteAnalysis(id);
      else if (type === 'step') await tradeSpendWaterfallService.deleteStep(id);
      else await tradeSpendWaterfallService.deleteDecomposition(id);
      showMsg(`${type} deleted`);
      loadData();
    } catch (e) { showMsg('Delete failed', 'error'); }
  };

  const s = summary || {};
  const maxStepAmt = steps.length > 0 ? Math.max(...steps.map(st => Math.abs(st.amount || 0)), 1) : 1;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>Trade Spend Waterfall Analysis</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5 }}>Waterfall charts showing spend decomposition, ROI analysis, and effectiveness tracking</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog('analysis')}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>New Analysis</Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Analyses" value={s.totalAnalyses || 0} icon={<AnalysisIcon />} color="#3B82F6" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Completed" value={s.completedAnalyses || 0} icon={<ChartIcon />} color="#10B981" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Decompositions" value={s.totalDecompositions || 0} icon={<DecompIcon />} color="#8B5CF6" /></Grid>
        <Grid item xs={6} sm={3}><SummaryCard title="Total Trade Spend" value={`R${Number(s.totalTradeSpend || 0).toLocaleString()}`} icon={<WaterfallIcon />} color="#EF4444" /></Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Analyses" icon={<AnalysisIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="Waterfall Chart" icon={<ChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" disabled={!selectedAnalysis} />
        <Tab label="Decompositions" icon={<DecompIcon sx={{ fontSize: 18 }} />} iconPosition="start" disabled={!selectedAnalysis} />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Dimension</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Gross Revenue</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trade Spend</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Spend %</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyses.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No analyses found</TableCell></TableRow>
                ) : analyses.map(a => (
                  <TableRow key={a.id} hover sx={{ cursor: 'pointer', bgcolor: selectedAnalysis === a.id ? alpha('#7C3AED', 0.05) : 'transparent' }}
                    onClick={() => { setSelectedAnalysis(a.id); setTab(1); }}>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{a.name}</Typography></TableCell>
                    <TableCell><Chip label={a.analysisType} size="small" variant="outlined" /></TableCell>
                    <TableCell>{a.periodStart?.slice(0, 10)} - {a.periodEnd?.slice(0, 10)}</TableCell>
                    <TableCell>{a.dimensionName || a.dimension}</TableCell>
                    <TableCell>R{Number(a.grossRevenue || 0).toLocaleString()}</TableCell>
                    <TableCell>R{Number(a.totalTradeSpend || 0).toLocaleString()}</TableCell>
                    <TableCell><Chip label={`${(a.tradeSpendPct || 0).toFixed(1)}%`} size="small" sx={{ bgcolor: alpha('#EF4444', 0.1), color: '#EF4444', fontWeight: 600 }} /></TableCell>
                    <TableCell><Chip label={a.status} size="small" sx={{ bgcolor: a.status === 'completed' ? alpha('#10B981', 0.1) : alpha('#F59E0B', 0.1), color: a.status === 'completed' ? '#10B981' : '#F59E0B', fontWeight: 600 }} /></TableCell>
                    <TableCell align="right" onClick={e => e.stopPropagation()}>
                      <IconButton size="small" onClick={() => openDialog('analysis', a, a.id)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete('analysis', a.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tab === 1 && selectedAnalysis && (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Waterfall Steps</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => openDialog('step')} variant="outlined">Add Step</Button>
          </Box>
          {steps.length === 0 ? (
            <Typography sx={{ color: '#9CA3AF', textAlign: 'center', py: 4 }}>No waterfall steps. Add steps to build the chart.</Typography>
          ) : (
            <Box>
              {steps.map((st, idx) => (
                <Box key={st.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#F9FAFB' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7280', minWidth: 24 }}>{idx + 1}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{st.label}</Typography>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>{st.category || st.stepType}</Typography>
                  </Box>
                  <Box sx={{ width: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flex: 1, height: 20, borderRadius: 1, bgcolor: '#E5E7EB', overflow: 'hidden' }}>
                        <Box sx={{ width: `${Math.min(Math.abs(st.amount || 0) / maxStepAmt * 100, 100)}%`, height: '100%', bgcolor: STEP_COLORS[st.stepType] || '#3B82F6', borderRadius: 1 }} />
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: STEP_COLORS[st.stepType] || '#3B82F6', minWidth: 100, textAlign: 'right' }}>
                    {st.stepType === 'deduction' ? '-' : st.stepType === 'addition' ? '+' : ''}R{Math.abs(st.amount || 0).toLocaleString()}
                  </Typography>
                  <Chip label={`${(st.percentage || 0).toFixed(1)}%`} size="small" sx={{ bgcolor: alpha(STEP_COLORS[st.stepType] || '#3B82F6', 0.1), color: STEP_COLORS[st.stepType] || '#3B82F6' }} />
                  <IconButton size="small" onClick={() => handleDelete('step', st.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {tab === 2 && selectedAnalysis && (
        <Paper sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Spend Decompositions</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={() => openDialog('decomposition')} variant="outlined">Add Decomposition</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Channel</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Gross</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Net</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>% of Total</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ROI</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Effectiveness</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {decompositions.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No decompositions</TableCell></TableRow>
                ) : decompositions.map(d => (
                  <TableRow key={d.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{d.name}</Typography></TableCell>
                    <TableCell><Chip label={d.spendType} size="small" variant="outlined" /></TableCell>
                    <TableCell>{d.channel || '-'}</TableCell>
                    <TableCell>R{Number(d.grossAmount || 0).toLocaleString()}</TableCell>
                    <TableCell>R{Number(d.netAmount || 0).toLocaleString()}</TableCell>
                    <TableCell><Chip label={`${(d.pctOfTotal || 0).toFixed(1)}%`} size="small" /></TableCell>
                    <TableCell sx={{ color: (d.roi || 0) >= 1 ? '#10B981' : '#EF4444', fontWeight: 600 }}>{(d.roi || 0).toFixed(2)}x</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={Math.min(d.effectivenessScore || 0, 100)} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#E5E7EB' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{(d.effectivenessScore || 0).toFixed(0)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleDelete('decomposition', d.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editId ? 'Edit' : 'Create'} {dialogType === 'analysis' ? 'Analysis' : dialogType === 'step' ? 'Waterfall Step' : 'Decomposition'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {dialogType === 'analysis' && (
              <>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} required /></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Analysis Type" value={editData.analysisType} onChange={e => setEditData(d => ({ ...d, analysisType: e.target.value }))}>
                    {['trade_spend','promotion_roi','customer_profitability','channel_effectiveness'].map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Period Start" value={editData.periodStart} onChange={e => setEditData(d => ({ ...d, periodStart: e.target.value }))} InputLabelProps={{ shrink: true }} required /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Period End" value={editData.periodEnd} onChange={e => setEditData(d => ({ ...d, periodEnd: e.target.value }))} InputLabelProps={{ shrink: true }} required /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Gross Revenue (R)" value={editData.grossRevenue} onChange={e => setEditData(d => ({ ...d, grossRevenue: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Net Revenue (R)" value={editData.netRevenue} onChange={e => setEditData(d => ({ ...d, netRevenue: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Total Trade Spend (R)" value={editData.totalTradeSpend} onChange={e => setEditData(d => ({ ...d, totalTradeSpend: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Dimension" value={editData.dimension} onChange={e => setEditData(d => ({ ...d, dimension: e.target.value }))}>
                    {['overall','customer','product','channel','region','brand','category'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Status" value={editData.status} onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
                    {['draft','in_progress','completed','archived'].map(s => <MenuItem key={s} value={s}>{s.replace(/_/g, ' ')}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" value={editData.notes} onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} /></Grid>
              </>
            )}
            {dialogType === 'step' && (
              <>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Label" value={editData.label} onChange={e => setEditData(d => ({ ...d, label: e.target.value }))} required /></Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth select label="Step Type" value={editData.stepType} onChange={e => setEditData(d => ({ ...d, stepType: e.target.value }))}>
                    {['addition','deduction','subtotal','net'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}><TextField fullWidth type="number" label="Order" value={editData.stepOrder} onChange={e => setEditData(d => ({ ...d, stepOrder: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Amount (R)" value={editData.amount} onChange={e => setEditData(d => ({ ...d, amount: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Percentage %" value={editData.percentage} onChange={e => setEditData(d => ({ ...d, percentage: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Category" value={editData.category} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} /></Grid>
              </>
            )}
            {dialogType === 'decomposition' && (
              <>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} required /></Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="Spend Type" value={editData.spendType} onChange={e => setEditData(d => ({ ...d, spendType: e.target.value }))}>
                    {['trade_promotion','off_invoice','billback','rebate','scan_allowance','display_allowance','slotting_fee','coop_advertising','other'].map(t => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth label="Channel" value={editData.channel} onChange={e => setEditData(d => ({ ...d, channel: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Gross Amount (R)" value={editData.grossAmount} onChange={e => setEditData(d => ({ ...d, grossAmount: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Net Amount (R)" value={editData.netAmount} onChange={e => setEditData(d => ({ ...d, netAmount: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={3}><TextField fullWidth type="number" label="% of Total" value={editData.pctOfTotal} onChange={e => setEditData(d => ({ ...d, pctOfTotal: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={3}><TextField fullWidth type="number" label="ROI" value={editData.roi} onChange={e => setEditData(d => ({ ...d, roi: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={3}><TextField fullWidth type="number" label="Volume Impact" value={editData.volumeImpact} onChange={e => setEditData(d => ({ ...d, volumeImpact: e.target.value }))} /></Grid>
                <Grid item xs={12} sm={3}><TextField fullWidth type="number" label="Effectiveness (0-100)" value={editData.effectivenessScore} onChange={e => setEditData(d => ({ ...d, effectivenessScore: e.target.value }))} /></Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            {editId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
