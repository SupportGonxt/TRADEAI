import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button, IconButton,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, LinearProgress, Alert, Snackbar, alpha
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, TrendingDown as CannibIcon,
  Assessment as AnalysisIcon, GridOn as MatrixIcon
} from '@mui/icons-material';
import { cannibalizationHaloService } from '../../services/api';

const SummaryCard = ({ title, value, color = '#7C3AED' }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>{title}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ color, mt: 0.5 }}>{value}</Typography>
    </CardContent>
  </Card>
);

const emptyAnalysis = { name: '', description: '', analysisType: 'cannibalization', periodStart: '', periodEnd: '', focalProductName: '', focalCategory: '', methodology: 'difference_in_differences' };
const emptyEffect = { analysisId: '', productName: '', category: '', brand: '', effectType: 'neutral', baselineSales: 0, actualSales: 0, salesChange: 0, salesChangePct: 0, confidence: 0 };
const emptyMatrix = { analysisId: '', name: '', matrixType: 'correlation', rowName: '', colName: '', correlation: 0, liftCoefficient: 0, interactionType: 'neutral' };

export default function CannibalizationHalo() {
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState({});
  const [analyses, setAnalyses] = useState([]);
  const [effects, setEffects] = useState([]);
  const [matrices, setMatrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, type: '', mode: 'create', data: {} });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, anlRes] = await Promise.all([
        cannibalizationHaloService.getSummary().catch(() => ({ data: {} })),
        cannibalizationHaloService.getAnalyses().catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data || {});
      setAnalyses(anlRes.data || []);
      const [effRes, matRes] = await Promise.all([
        cannibalizationHaloService.getEffects().catch(() => ({ data: [] })),
        cannibalizationHaloService.getMatrices().catch(() => ({ data: [] })),
      ]);
      setEffects(effRes.data || []);
      setMatrices(matRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openDialog = (type, mode = 'create', data = null) => {
    const defaults = type === 'analysis' ? emptyAnalysis : type === 'effect' ? emptyEffect : emptyMatrix;
    setDialog({ open: true, type, mode, data: data || { ...defaults } });
  };

  const handleSave = async () => {
    try {
      const { type, mode, data } = dialog;
      if (type === 'analysis') {
        if (mode === 'edit') await cannibalizationHaloService.updateAnalysis(data.id, data);
        else await cannibalizationHaloService.createAnalysis(data);
      } else if (type === 'effect') {
        await cannibalizationHaloService.createEffect(data);
      } else {
        await cannibalizationHaloService.createMatrix(data);
      }
      setDialog({ open: false, type: '', mode: 'create', data: {} });
      setSnack({ open: true, message: `${type} saved`, severity: 'success' });
      loadData();
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Error saving', severity: 'error' });
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'analysis') await cannibalizationHaloService.deleteAnalysis(id);
      else if (type === 'effect') await cannibalizationHaloService.deleteEffect(id);
      else await cannibalizationHaloService.deleteMatrix(id);
      setSnack({ open: true, message: 'Deleted', severity: 'success' });
      loadData();
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Error deleting', severity: 'error' });
    }
  };

  const effectColor = (type) => {
    if (type === 'cannibalized') return '#EF4444';
    if (type === 'halo') return '#10B981';
    if (type === 'complementary') return '#3B82F6';
    if (type === 'substitute') return '#F59E0B';
    return '#6B7280';
  };

  const { data: d } = dialog;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Cannibalization & Halo Analysis</Typography>
          <Typography variant="body2" color="text.secondary">Analyze cross-product effects of promotions</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog(tab === 0 ? 'analysis' : tab === 1 ? 'effect' : 'matrix')} size="small"
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
            Add {tab === 0 ? 'Analysis' : tab === 1 ? 'Effect' : 'Matrix'}
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><SummaryCard title="Total Analyses" value={summary.totalAnalyses || 0} /></Grid>
        <Grid item xs={6} md={3}><SummaryCard title="Product Effects" value={summary.totalEffects || 0} color="#3B82F6" /></Grid>
        <Grid item xs={6} md={3}><SummaryCard title="Cannibalized" value={summary.cannibalizedProducts || 0} color="#EF4444" /></Grid>
        <Grid item xs={6} md={3}><SummaryCard title="Halo Effects" value={summary.haloProducts || 0} color="#10B981" /></Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          <Tab icon={<AnalysisIcon />} iconPosition="start" label="Analyses" />
          <Tab icon={<CannibIcon />} iconPosition="start" label="Product Effects" />
          <Tab icon={<MatrixIcon />} iconPosition="start" label="Halo Matrix" />
        </Tabs>

        {tab === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Focal Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Net Impact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyses.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>{a.name}</TableCell>
                    <TableCell><Chip label={a.analysisType} size="small" /></TableCell>
                    <TableCell>{a.periodStart} — {a.periodEnd}</TableCell>
                    <TableCell>{a.focalProductName || '—'}</TableCell>
                    <TableCell align="right" sx={{ color: (a.netImpact || 0) >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                      {(a.netImpact || 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' })}
                    </TableCell>
                    <TableCell><Chip label={a.status} size="small" color={a.status === 'completed' ? 'success' : 'default'} /></TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openDialog('analysis', 'edit', a)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete('analysis', a.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {analyses.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No analyses yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Effect</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Baseline Sales</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actual Sales</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Change %</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Confidence</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {effects.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>{e.productName}</TableCell>
                    <TableCell>{e.category || '—'}</TableCell>
                    <TableCell><Chip label={e.effectType} size="small" sx={{ bgcolor: alpha(effectColor(e.effectType), 0.1), color: effectColor(e.effectType) }} /></TableCell>
                    <TableCell align="right">{(e.baselineSales || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{(e.actualSales || 0).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: (e.salesChangePct || 0) >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                      {(e.salesChangePct || 0).toFixed(1)}%
                    </TableCell>
                    <TableCell align="right">{((e.confidence || 0) * 100).toFixed(0)}%</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleDelete('effect', e.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {effects.length === 0 && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No effects yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 2 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Row</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Column</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Correlation</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Lift</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Interaction</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matrices.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.rowName || '—'}</TableCell>
                    <TableCell>{m.colName || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{(m.correlation || 0).toFixed(3)}</TableCell>
                    <TableCell align="right">{(m.liftCoefficient || 0).toFixed(3)}</TableCell>
                    <TableCell><Chip label={m.interactionType} size="small" sx={{ bgcolor: alpha(effectColor(m.interactionType), 0.1), color: effectColor(m.interactionType) }} /></TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleDelete('matrix', m.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {matrices.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No matrix entries yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'edit' ? 'Edit' : 'New'} {dialog.type}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {dialog.type === 'analysis' && (
            <>
              <TextField label="Name" value={d.name || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, name: e.target.value } })} fullWidth size="small" />
              <TextField label="Description" value={d.description || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, description: e.target.value } })} fullWidth size="small" multiline rows={2} />
              <TextField label="Analysis Type" value={d.analysisType || 'cannibalization'} onChange={(e) => setDialog({ ...dialog, data: { ...d, analysisType: e.target.value } })} select fullWidth size="small">
                {['cannibalization', 'halo', 'combined', 'portfolio'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Period Start" type="date" value={d.periodStart || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, periodStart: e.target.value } })} fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField label="Period End" type="date" value={d.periodEnd || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, periodEnd: e.target.value } })} fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
              </Grid>
              <TextField label="Focal Product" value={d.focalProductName || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, focalProductName: e.target.value } })} fullWidth size="small" />
              <TextField label="Methodology" value={d.methodology || 'difference_in_differences'} onChange={(e) => setDialog({ ...dialog, data: { ...d, methodology: e.target.value } })} select fullWidth size="small">
                {['difference_in_differences', 'regression', 'matched_market', 'time_series', 'bayesian'].map((m) => <MenuItem key={m} value={m}>{m.replace(/_/g, ' ')}</MenuItem>)}
              </TextField>
            </>
          )}
          {dialog.type === 'effect' && (
            <>
              <TextField label="Analysis" value={d.analysisId || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, analysisId: e.target.value } })} select fullWidth size="small">
                {analyses.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </TextField>
              <TextField label="Product Name" value={d.productName || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, productName: e.target.value } })} fullWidth size="small" />
              <TextField label="Category" value={d.category || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, category: e.target.value } })} fullWidth size="small" />
              <TextField label="Effect Type" value={d.effectType || 'neutral'} onChange={(e) => setDialog({ ...dialog, data: { ...d, effectType: e.target.value } })} select fullWidth size="small">
                {['cannibalized', 'halo', 'neutral', 'complementary', 'substitute'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Baseline Sales" type="number" value={d.baselineSales || 0} onChange={(e) => setDialog({ ...dialog, data: { ...d, baselineSales: parseFloat(e.target.value) } })} fullWidth size="small" /></Grid>
                <Grid item xs={6}><TextField label="Actual Sales" type="number" value={d.actualSales || 0} onChange={(e) => setDialog({ ...dialog, data: { ...d, actualSales: parseFloat(e.target.value) } })} fullWidth size="small" /></Grid>
              </Grid>
              <TextField label="Confidence (0-1)" type="number" value={d.confidence || 0} onChange={(e) => setDialog({ ...dialog, data: { ...d, confidence: parseFloat(e.target.value) } })} fullWidth size="small" inputProps={{ step: 0.01, min: 0, max: 1 }} />
            </>
          )}
          {dialog.type === 'matrix' && (
            <>
              <TextField label="Analysis" value={d.analysisId || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, analysisId: e.target.value } })} select fullWidth size="small">
                <MenuItem value="">None</MenuItem>
                {analyses.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </TextField>
              <TextField label="Name" value={d.name || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, name: e.target.value } })} fullWidth size="small" />
              <TextField label="Matrix Type" value={d.matrixType || 'correlation'} onChange={(e) => setDialog({ ...dialog, data: { ...d, matrixType: e.target.value } })} select fullWidth size="small">
                {['correlation', 'elasticity', 'lift', 'affinity'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Row Product" value={d.rowName || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, rowName: e.target.value } })} fullWidth size="small" /></Grid>
                <Grid item xs={6}><TextField label="Column Product" value={d.colName || ''} onChange={(e) => setDialog({ ...dialog, data: { ...d, colName: e.target.value } })} fullWidth size="small" /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Correlation" type="number" value={d.correlation || 0} onChange={(e) => setDialog({ ...dialog, data: { ...d, correlation: parseFloat(e.target.value) } })} fullWidth size="small" inputProps={{ step: 0.01 }} /></Grid>
                <Grid item xs={6}><TextField label="Lift Coefficient" type="number" value={d.liftCoefficient || 0} onChange={(e) => setDialog({ ...dialog, data: { ...d, liftCoefficient: parseFloat(e.target.value) } })} fullWidth size="small" inputProps={{ step: 0.01 }} /></Grid>
              </Grid>
              <TextField label="Interaction Type" value={d.interactionType || 'neutral'} onChange={(e) => setDialog({ ...dialog, data: { ...d, interactionType: e.target.value } })} select fullWidth size="small">
                {['cannibalized', 'halo', 'neutral', 'complementary', 'substitute'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
