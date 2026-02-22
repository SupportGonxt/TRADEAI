import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Tabs, Tab,
  LinearProgress, Tooltip, CircularProgress
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Refresh as RefreshIcon, PlayArrow as RunIcon, Schedule as ScheduleIcon,
  Star as StarIcon, StarBorder as StarBorderIcon, Search as SearchIcon,
  Assessment as ReportIcon, Description as TemplateIcon,
  ArrowBack as BackIcon, Visibility as ViewIcon, TableChart as CrossIcon
} from '@mui/icons-material';
import { advancedReportingService } from '../../services/api';

const statusColors = {
  active: 'success', draft: 'default', archived: 'default', completed: 'success',
  processing: 'warning', failed: 'error', pending: 'warning'
};

const AdvancedReportingManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState({});
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [crossModule, setCrossModule] = useState(null);
  const [total, setTotal] = useState(0);
  const [reportTotal, setReportTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [reportPage, setReportPage] = useState(0);
  const [reportRowsPerPage, setReportRowsPerPage] = useState(25);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [detailView, setDetailView] = useState(false);
  const [reportDetailView, setReportDetailView] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [scheduleForm, setScheduleForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const res = await advancedReportingService.getSummary();
      if (res.success) setSummary(res.data);
    } catch (e) { console.error('Error loading summary:', e); }
  }, []);

  const loadOptions = useCallback(async () => {
    try {
      const res = await advancedReportingService.getOptions();
      if (res.success) setOptions(res.data);
    } catch (e) { console.error('Error loading options:', e); }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: rowsPerPage, offset: page * rowsPerPage };
      if (search) params.search = search;
      if (categoryFilter) params.report_category = categoryFilter;
      const res = await advancedReportingService.getTemplates(params);
      if (res.success) { setTemplates(res.data || []); setTotal(res.total || 0); }
    } catch (e) { console.error('Error loading templates:', e); }
    finally { setLoading(false); }
  }, [page, rowsPerPage, search, categoryFilter]);

  const loadReports = useCallback(async () => {
    try {
      const params = { limit: reportRowsPerPage, offset: reportPage * reportRowsPerPage };
      const res = await advancedReportingService.getReports(params);
      if (res.success) { setReports(res.data || []); setReportTotal(res.total || 0); }
    } catch (e) { console.error('Error loading reports:', e); }
  }, [reportPage, reportRowsPerPage]);

  const loadSchedules = useCallback(async () => {
    try {
      const res = await advancedReportingService.getSchedules();
      if (res.success) setSchedules(res.data || []);
    } catch (e) { console.error('Error loading schedules:', e); }
  }, []);

  const loadCrossModule = useCallback(async () => {
    try {
      const res = await advancedReportingService.getCrossModuleReport();
      if (res.success) setCrossModule(res.data);
    } catch (e) { console.error('Error loading cross-module report:', e); }
  }, []);

  useEffect(() => { loadSummary(); loadOptions(); }, [loadSummary, loadOptions]);
  useEffect(() => { loadTemplates(); }, [loadTemplates]);
  useEffect(() => { if (activeTab === 1) loadReports(); }, [activeTab, loadReports]);
  useEffect(() => { if (activeTab === 2) loadSchedules(); }, [activeTab, loadSchedules]);
  useEffect(() => { if (activeTab === 3) loadCrossModule(); }, [activeTab, loadCrossModule]);

  const handleCreate = () => {
    setFormData({ name: '', description: '', reportCategory: 'general', reportType: 'tabular', dataSource: 'promotions' });
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (template) => {
    setFormData({
      name: template.name || '', description: template.description || '',
      reportCategory: template.reportCategory || template.report_category || 'general',
      reportType: template.reportType || template.report_type || 'tabular',
      dataSource: template.dataSource || template.data_source || 'promotions',
      status: template.status || 'active', notes: template.notes || ''
    });
    setSelectedTemplate(template);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setActionLoading(true);
      if (dialogMode === 'create') {
        await advancedReportingService.createTemplate(formData);
      } else {
        await advancedReportingService.updateTemplate(selectedTemplate.id || selectedTemplate._id, formData);
      }
      setDialogOpen(false);
      loadTemplates();
      loadSummary();
    } catch (e) { console.error('Error saving template:', e); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"? This will also delete associated reports and schedules.`)) return;
    try {
      await advancedReportingService.deleteTemplate(template.id || template._id);
      loadTemplates();
      loadSummary();
    } catch (e) { console.error('Error deleting template:', e); }
  };

  const handleRun = async (template) => {
    try {
      setActionLoading(true);
      const res = await advancedReportingService.runTemplate(template.id || template._id);
      if (res.success) {
        loadTemplates();
        loadReports();
        loadSummary();
      }
    } catch (e) { console.error('Error running report:', e); }
    finally { setActionLoading(false); }
  };

  const handleViewDetail = async (template) => {
    try {
      const res = await advancedReportingService.getTemplateById(template.id || template._id);
      if (res.success) { setSelectedTemplate(res.data); setDetailView(true); }
    } catch (e) { console.error('Error loading template detail:', e); }
  };

  const handleViewReport = async (report) => {
    try {
      const res = await advancedReportingService.getReportById(report.id || report._id);
      if (res.success) { setSelectedReport(res.data); setReportDetailView(true); }
    } catch (e) { console.error('Error loading report detail:', e); }
  };

  const handleToggleFavorite = async (report) => {
    try {
      await advancedReportingService.toggleFavorite(report.id || report._id);
      loadReports();
    } catch (e) { console.error('Error toggling favorite:', e); }
  };

  const handleDeleteReport = async (report) => {
    if (!window.confirm(`Delete report "${report.name}"?`)) return;
    try {
      await advancedReportingService.deleteReport(report.id || report._id);
      loadReports();
      loadSummary();
    } catch (e) { console.error('Error deleting report:', e); }
  };

  const handleCreateSchedule = () => {
    setScheduleForm({
      templateId: selectedTemplate?.id || selectedTemplate?._id || '',
      name: '', frequency: 'weekly', timeOfDay: '08:00', format: 'pdf', recipients: []
    });
    setScheduleDialogOpen(true);
  };

  const handleSaveSchedule = async () => {
    try {
      setActionLoading(true);
      await advancedReportingService.createSchedule(scheduleForm);
      setScheduleDialogOpen(false);
      loadSchedules();
      loadSummary();
    } catch (e) { console.error('Error creating schedule:', e); }
    finally { setActionLoading(false); }
  };

  const handleDeleteSchedule = async (schedule) => {
    if (!window.confirm(`Delete schedule "${schedule.name}"?`)) return;
    try {
      await advancedReportingService.deleteSchedule(schedule.id || schedule._id);
      loadSchedules();
      loadSummary();
    } catch (e) { console.error('Error deleting schedule:', e); }
  };

  const fmt = (v) => v != null ? Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—';
  const fmtPct = (v) => v != null ? `${Number(v).toFixed(1)}%` : '—';

  const summaryCards = summary ? [
    { label: 'Templates', value: summary.templates?.total || 0, color: '#7C3AED' },
    { label: 'Active Templates', value: summary.templates?.active || 0, color: '#10B981' },
    { label: 'Saved Reports', value: summary.reports?.total || 0, color: '#3B82F6' },
    { label: 'Favorites', value: summary.reports?.favorites || 0, color: '#F59E0B' },
    { label: 'This Week', value: summary.reports?.recentWeek || 0, color: '#8B5CF6' },
    { label: 'Schedules', value: summary.schedules?.active || 0, color: '#EF4444' },
  ] : [];

  if (reportDetailView && selectedReport) {
    const summaryData = typeof selectedReport.summaryData === 'string' ? JSON.parse(selectedReport.summaryData || '{}') : (selectedReport.summaryData || selectedReport.summary_data || {});
    const reportData = typeof selectedReport.reportData === 'string' ? JSON.parse(selectedReport.reportData || '[]') : (selectedReport.reportData || selectedReport.report_data || []);

    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => { setReportDetailView(false); setSelectedReport(null); }}><BackIcon /></IconButton>
          <Typography variant="h5" fontWeight={700}>{selectedReport.name}</Typography>
          <Chip label={selectedReport.status} color={statusColors[selectedReport.status] || 'default'} size="small" />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Rows', value: fmt(summaryData.totalRows || selectedReport.rowCount || selectedReport.row_count) },
            { label: 'Total Amount', value: `R ${fmt(summaryData.totalAmount)}` },
            { label: 'Avg Amount', value: `R ${fmt(summaryData.avgAmount)}` },
            { label: 'Max', value: `R ${fmt(summaryData.maxAmount)}` },
            { label: 'Min', value: `R ${fmt(summaryData.minAmount)}` },
            { label: 'Gen Time', value: `${selectedReport.generationTimeMs || selectedReport.generation_time_ms || 0}ms` },
          ].map((item, i) => (
            <Grid item xs={12} sm={6} sm={4} md={2} key={i}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6" fontWeight={600}>{item.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {summaryData.statusBreakdown && Object.keys(summaryData.statusBreakdown).length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Status Breakdown</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(summaryData.statusBreakdown).map(([s, c]) => (
                <Chip key={s} label={`${s}: ${c}`} color={statusColors[s] || 'default'} variant="outlined" />
              ))}
            </Box>
          </Paper>
        )}

        {Array.isArray(reportData) && reportData.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Report Data ({reportData.length} rows)</Typography>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(reportData[0]).slice(0, 8).map((key) => (
                      <TableCell key={key} sx={{ fontWeight: 600 }}>{key}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      {Object.keys(reportData[0]).slice(0, 8).map((key) => (
                        <TableCell key={key}>{typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '—')}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    );
  }

  if (detailView && selectedTemplate) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => { setDetailView(false); setSelectedTemplate(null); }}><BackIcon /></IconButton>
          <Typography variant="h5" fontWeight={700}>{selectedTemplate.name}</Typography>
          <Chip label={selectedTemplate.status} color={statusColors[selectedTemplate.status] || 'default'} size="small" />
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<ScheduleIcon />} onClick={handleCreateSchedule}>Schedule</Button>
          <Button variant="contained" startIcon={<RunIcon />} onClick={() => handleRun(selectedTemplate)} disabled={actionLoading}>
            Run Now
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Category', value: (options.reportCategories || []).find(t => t.value === (selectedTemplate.reportCategory || selectedTemplate.report_category))?.label || selectedTemplate.reportCategory || selectedTemplate.report_category },
            { label: 'Type', value: (options.reportTypes || []).find(t => t.value === (selectedTemplate.reportType || selectedTemplate.report_type))?.label || selectedTemplate.reportType || selectedTemplate.report_type },
            { label: 'Data Source', value: (options.dataSources || []).find(t => t.value === (selectedTemplate.dataSource || selectedTemplate.data_source))?.label || selectedTemplate.dataSource || selectedTemplate.data_source },
            { label: 'Run Count', value: selectedTemplate.runCount || selectedTemplate.run_count || 0 },
            { label: 'Version', value: selectedTemplate.version || 1 },
            { label: 'Last Run', value: selectedTemplate.lastRunAt || selectedTemplate.last_run_at || '—' },
          ].map((item, i) => (
            <Grid item xs={12} sm={6} sm={4} md={2} key={i}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6" fontWeight={600}>{item.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {selectedTemplate.recentReports && selectedTemplate.recentReports.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Recent Reports</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Rows</TableCell>
                    <TableCell align="right">Gen Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedTemplate.recentReports.map((rpt) => (
                    <TableRow key={rpt.id || rpt._id}>
                      <TableCell>{rpt.name}</TableCell>
                      <TableCell align="right">{fmt(rpt.rowCount || rpt.row_count)}</TableCell>
                      <TableCell align="right">{rpt.generationTimeMs || rpt.generation_time_ms || 0}ms</TableCell>
                      <TableCell><Chip label={rpt.status} size="small" color={statusColors[rpt.status] || 'default'} /></TableCell>
                      <TableCell>{(rpt.createdAt || rpt.created_at || '').slice(0, 10)}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleViewReport(rpt)}><ViewIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {selectedTemplate.schedules && selectedTemplate.schedules.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Schedules</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Last Run</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedTemplate.schedules.map((sch) => (
                    <TableRow key={sch.id || sch._id}>
                      <TableCell>{sch.name}</TableCell>
                      <TableCell>{sch.frequency}</TableCell>
                      <TableCell>{sch.timeOfDay || sch.time_of_day || '—'}</TableCell>
                      <TableCell>{sch.format}</TableCell>
                      <TableCell><Chip label={sch.isActive || sch.is_active ? 'Active' : 'Inactive'} size="small" color={sch.isActive || sch.is_active ? 'success' : 'default'} /></TableCell>
                      <TableCell>{(sch.lastRunAt || sch.last_run_at || '—').slice(0, 10)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Advanced Reporting</Typography>
          <Typography variant="body2" color="text.secondary">Configurable templates, scheduled reports, and cross-module analytics</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { loadSummary(); loadTemplates(); }}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>New Template</Button>
        </Box>
      </Box>

      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summaryCards.map((card, i) => (
            <Grid item xs={12} sm={6} sm={4} md={2} key={i}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${card.color}` }}>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: card.color }}>{card.value}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<TemplateIcon />} label="Templates" iconPosition="start" />
        <Tab icon={<ReportIcon />} label="Saved Reports" iconPosition="start" />
        <Tab icon={<ScheduleIcon />} label="Schedules" iconPosition="start" />
        <Tab icon={<CrossIcon />} label="Cross-Module" iconPosition="start" />
      </Tabs>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {activeTab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField size="small" placeholder="Search templates..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              sx={{ flex: 1 }}
            />
            <TextField select size="small" label="Category" value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">All</MenuItem>
              {(options.reportCategories || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Data Source</TableCell>
                  <TableCell align="right">Runs</TableCell>
                  <TableCell>Last Run</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id || t._id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewDetail(t)}>
                    <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                    <TableCell>{(options.reportCategories || []).find(c => c.value === (t.reportCategory || t.report_category))?.label || t.reportCategory || t.report_category}</TableCell>
                    <TableCell>{(options.reportTypes || []).find(c => c.value === (t.reportType || t.report_type))?.label || t.reportType || t.report_type}</TableCell>
                    <TableCell>{(options.dataSources || []).find(c => c.value === (t.dataSource || t.data_source))?.label || t.dataSource || t.data_source}</TableCell>
                    <TableCell align="right">{t.runCount || t.run_count || 0}</TableCell>
                    <TableCell>{(t.lastRunAt || t.last_run_at || '—').slice(0, 10)}</TableCell>
                    <TableCell><Chip label={t.status} size="small" color={statusColors[t.status] || 'default'} /></TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Run"><IconButton size="small" onClick={() => handleRun(t)} disabled={actionLoading}><RunIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEdit(t)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(t)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {templates.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>No templates found. Create your first report template.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} />
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Data Source</TableCell>
                  <TableCell align="right">Rows</TableCell>
                  <TableCell align="right">Gen Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id || r._id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewReport(r)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" onClick={() => handleToggleFavorite(r)}>
                        {r.isFavorite || r.is_favorite ? <StarIcon fontSize="small" sx={{ color: '#F59E0B' }} /> : <StarBorderIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                    <TableCell>{r.reportCategory || r.report_category}</TableCell>
                    <TableCell>{r.dataSource || r.data_source}</TableCell>
                    <TableCell align="right">{fmt(r.rowCount || r.row_count)}</TableCell>
                    <TableCell align="right">{r.generationTimeMs || r.generation_time_ms || 0}ms</TableCell>
                    <TableCell><Chip label={r.status} size="small" color={statusColors[r.status] || 'default'} /></TableCell>
                    <TableCell>{(r.createdAt || r.created_at || '').slice(0, 10)}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View"><IconButton size="small" onClick={() => handleViewReport(r)}><ViewIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteReport(r)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {reports.length === 0 && (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>No saved reports. Run a template to generate one.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={reportTotal} page={reportPage} onPageChange={(_, p) => setReportPage(p)} rowsPerPage={reportRowsPerPage} onRowsPerPageChange={(e) => { setReportRowsPerPage(parseInt(e.target.value)); setReportPage(0); }} />
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSchedule}>New Schedule</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell align="right">Runs</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Last Run</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id || s._id}>
                    <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                    <TableCell>{s.frequency}</TableCell>
                    <TableCell>{s.timeOfDay || s.time_of_day || '—'}</TableCell>
                    <TableCell>{(s.format || '').toUpperCase()}</TableCell>
                    <TableCell align="right">{s.runCount || s.run_count || 0}</TableCell>
                    <TableCell><Chip label={s.isActive || s.is_active ? 'Active' : 'Inactive'} size="small" color={s.isActive || s.is_active ? 'success' : 'default'} /></TableCell>
                    <TableCell>{(s.lastRunAt || s.last_run_at || '—').slice(0, 10)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteSchedule(s)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {schedules.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>No schedules configured.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 3 && (
        <Box>
          {crossModule ? (
            <Grid container spacing={3}>
              {[
                { label: 'Promotions', data: crossModule.promotions, fields: [{ k: 'total', l: 'Total' }] },
                { label: 'Budgets', data: crossModule.budgets, fields: [{ k: 'totalBudget', l: 'Budget', fmt: 'R' }, { k: 'totalUtilized', l: 'Utilized', fmt: 'R' }, { k: 'utilizationPct', l: 'Util %', fmt: '%' }] },
                { label: 'Trade Spends', data: crossModule.tradeSpends, fields: [{ k: 'totalSpend', l: 'Total Spend', fmt: 'R' }, { k: 'count', l: 'Count' }] },
                { label: 'Claims', data: crossModule.claims, fields: [{ k: 'totalClaimed', l: 'Claimed', fmt: 'R' }, { k: 'totalApproved', l: 'Approved', fmt: 'R' }, { k: 'approvalRate', l: 'Approval %', fmt: '%' }] },
                { label: 'Deductions', data: crossModule.deductions, fields: [{ k: 'totalDeductions', l: 'Total', fmt: 'R' }, { k: 'totalMatched', l: 'Matched', fmt: 'R' }, { k: 'matchRate', l: 'Match %', fmt: '%' }] },
                { label: 'Settlements', data: crossModule.settlements, fields: [{ k: 'totalSettled', l: 'Settled', fmt: 'R' }, { k: 'count', l: 'Count' }] },
              ].map((section, i) => (
                <Grid item xs={12} md={6} key={i}>
                  <Paper sx={{ p: 3, borderTop: '3px solid #7C3AED' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>{section.label}</Typography>
                    {section.fields.map((f, fi) => (
                      <Box key={fi} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">{f.l}</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {f.fmt === 'R' ? `R ${fmt(section.data?.[f.k])}` : f.fmt === '%' ? fmtPct(section.data?.[f.k]) : fmt(section.data?.[f.k])}
                        </Typography>
                      </Box>
                    ))}
                    {section.data?.byStatus && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {Object.entries(section.data.byStatus).map(([s, c]) => (
                          <Chip key={s} label={`${s}: ${c}`} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
          )}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Create Report Template' : 'Edit Report Template'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <TextField label="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} multiline rows={2} />
            <TextField select label="Category" value={formData.reportCategory || 'general'} onChange={(e) => setFormData({ ...formData, reportCategory: e.target.value })}>
              {(options.reportCategories || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="Report Type" value={formData.reportType || 'tabular'} onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}>
              {(options.reportTypes || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="Data Source" value={formData.dataSource || 'promotions'} onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}>
              {(options.dataSources || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            {dialogMode === 'edit' && (
              <TextField select label="Status" value={formData.status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>
            )}
            <TextField label="Notes" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={actionLoading || !formData.name}>
            {actionLoading ? <CircularProgress size={20} /> : dialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Report Schedule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Schedule Name" value={scheduleForm.name || ''} onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })} />
            <TextField select label="Template" value={scheduleForm.templateId || ''} onChange={(e) => setScheduleForm({ ...scheduleForm, templateId: e.target.value })}>
              {templates.map(t => <MenuItem key={t.id || t._id} value={t.id || t._id}>{t.name}</MenuItem>)}
            </TextField>
            <TextField select label="Frequency" value={scheduleForm.frequency || 'weekly'} onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}>
              {(options.scheduleFrequencies || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField label="Time of Day" type="time" value={scheduleForm.timeOfDay || '08:00'} onChange={(e) => setScheduleForm({ ...scheduleForm, timeOfDay: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField select label="Export Format" value={scheduleForm.format || 'pdf'} onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value })}>
              {(options.exportFormats || []).map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveSchedule} disabled={actionLoading || !scheduleForm.name || !scheduleForm.templateId}>
            {actionLoading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedReportingManagement;
