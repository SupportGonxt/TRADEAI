import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Label as LabelIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import dataLineageService from '../../services/dataLineage/dataLineageService';
import api from '../../services/api';

const COLORS = ['#f44336', '#ff9800', '#4caf50', '#8B5CF6', '#9c27b0', '#00bcd4'];

const VARIANCE_CATEGORIES = [
  { value: 'spend_variance', label: 'Spend Variance', color: '#f44336' },
  { value: 'volume_variance', label: 'Volume Variance', color: '#ff9800' },
  { value: 'revenue_variance', label: 'Revenue Variance', color: '#4caf50' },
  { value: 'roi_variance', label: 'ROI Variance', color: '#8B5CF6' },
  { value: 'timing_variance', label: 'Timing Variance', color: '#9c27b0' },
  { value: 'execution_variance', label: 'Execution Variance', color: '#00bcd4' }
];

const VarianceAnalysisPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [reasonCodes, setReasonCodes] = useState([]);
  const [varianceReport, setVarianceReport] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [varianceAnalysis, setVarianceAnalysis] = useState(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedVariance, setSelectedVariance] = useState(null);
  const [selectedReasonCode, setSelectedReasonCode] = useState('');
  const [tagNotes, setTagNotes] = useState('');
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    name: '',
    description: '',
    category: 'spend_variance'
  });

  useEffect(() => {
    loadReasonCodes();
    loadPromotions();
    loadVarianceReport();
  }, []);

  const loadReasonCodes = async () => {
    try {
      const response = await dataLineageService.getVarianceReasonCodes();
      setReasonCodes(response.data || []);
    } catch (error) {
      console.error('Error loading reason codes:', error);
    }
  };

  const loadPromotions = async () => {
    try {
      const response = await api.get('/promotions', { params: { limit: 100 } });
      setPromotions(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const loadVarianceReport = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await dataLineageService.getVarianceReport({
        entityType: 'promotion',
        startDate,
        endDate
      });
      setVarianceReport(response.data);
    } catch (error) {
      console.error('Error loading variance report:', error);
    }
  };

  const handleAnalyzePromotion = async () => {
    if (!selectedPromotion) {
      enqueueSnackbar('Please select a promotion', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const response = await dataLineageService.analyzePromotionVariance(selectedPromotion);
      setVarianceAnalysis(response.data);
      enqueueSnackbar('Variance analysis complete', { variant: 'success' });
    } catch (error) {
      console.error('Error analyzing variance:', error);
      enqueueSnackbar('Failed to analyze variance', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTagVariance = (variance) => {
    setSelectedVariance(variance);
    setSelectedReasonCode('');
    setTagNotes('');
    setTagDialogOpen(true);
  };

  const handleSubmitTag = async () => {
    if (!selectedReasonCode) {
      enqueueSnackbar('Please select a reason code', { variant: 'warning' });
      return;
    }

    try {
      await dataLineageService.tagVariance({
        entityType: 'promotion',
        entityId: selectedPromotion,
        metricType: selectedVariance.metricType,
        reasonCodeId: selectedReasonCode,
        notes: tagNotes
      });
      enqueueSnackbar('Variance tagged successfully', { variant: 'success' });
      setTagDialogOpen(false);
      handleAnalyzePromotion();
    } catch (error) {
      console.error('Error tagging variance:', error);
      enqueueSnackbar('Failed to tag variance', { variant: 'error' });
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await dataLineageService.seedDefaultReasonCodes();
      enqueueSnackbar('Default reason codes seeded', { variant: 'success' });
      loadReasonCodes();
    } catch (error) {
      console.error('Error seeding defaults:', error);
      enqueueSnackbar('Failed to seed default codes', { variant: 'error' });
    }
  };

  const handleCreateCode = async () => {
    if (!newCode.code || !newCode.name) {
      enqueueSnackbar('Please provide code and name', { variant: 'warning' });
      return;
    }

    try {
      await dataLineageService.createVarianceReasonCode(newCode);
      enqueueSnackbar('Reason code created', { variant: 'success' });
      setCodeDialogOpen(false);
      setNewCode({ code: '', name: '', description: '', category: 'spend_variance' });
      loadReasonCodes();
    } catch (error) {
      console.error('Error creating code:', error);
      enqueueSnackbar('Failed to create reason code', { variant: 'error' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getVarianceColor = (variance) => {
    if (Math.abs(variance) < 5) return 'success';
    if (Math.abs(variance) < 15) return 'warning';
    return 'error';
  };

  const getVarianceIcon = (variance) => {
    if (variance > 0) return <TrendingUpIcon color="error" />;
    if (variance < 0) return <TrendingDownIcon color="success" />;
    return <CheckCircleIcon color="success" />;
  };

  const chartData = varianceReport?.byReasonCode?.map((item) => ({
    name: (item.id || item._id || 'Unknown').toString().substring(0, 15),
    count: item.count,
    avgVariance: Math.abs(item.avgVariance || 0)
  })) || [];

  const categoryData = VARIANCE_CATEGORIES.map((cat) => ({
    name: cat.label,
    value: reasonCodes.filter((rc) => rc.category === cat.value).length
  })).filter((d) => d.value > 0);

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" href="/dashboard">Home</Link>
        <Link color="inherit" href="/analytics">Analytics</Link>
        <Typography color="text.primary">Variance Analysis</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Variance Analysis & Reason Codes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Analyze plan vs actual variances and tag with standardized reason codes for insights
          </Typography>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<AssessmentIcon />} label="Analyze Variances" />
        <Tab icon={<LabelIcon />} label="Reason Codes" />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <TextField
                    select
                    fullWidth
                    label="Select Promotion to Analyze"
                    value={selectedPromotion}
                    onChange={(e) => setSelectedPromotion(e.target.value)}
                  >
                    {promotions.map((promo) => (
                      <MenuItem key={promo.id || promo._id} value={promo.id || promo._id}>
                        {promo.name} ({promo.status})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AssessmentIcon />}
                    onClick={handleAnalyzePromotion}
                    disabled={loading || !selectedPromotion}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Variance'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {varianceAnalysis && (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {varianceAnalysis.variances?.map((variance) => (
                  <Grid item xs={12} sm={6} md={3} key={variance.metricType}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2" color="textSecondary">
                            {formatLabel(variance.metricType)}
                          </Typography>
                          {getVarianceIcon(variance.percentageVariance)}
                        </Box>
                        <Typography variant="h4" sx={{ my: 1 }}>
                          {formatPercent(variance.percentageVariance)}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="textSecondary">
                            Plan: {formatCurrency(variance.planned)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Actual: {formatCurrency(variance.actual)}
                          </Typography>
                        </Box>
                        <Chip
                          label={variance.severity}
                          size="small"
                          color={getVarianceColor(variance.percentageVariance)}
                          sx={{ mt: 1 }}
                        />
                        <Box sx={{ mt: 2 }}>
                          <Button
                            size="small"
                            startIcon={<LabelIcon />}
                            onClick={() => handleTagVariance(variance)}
                          >
                            Tag Reason
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {varianceAnalysis.summary && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Variance Summary</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" color="textSecondary">Overall Status</Typography>
                          <Chip
                            label={varianceAnalysis.summary.overallStatus}
                            color={varianceAnalysis.summary.overallStatus === 'on_track' ? 'success' : 'warning'}
                            sx={{ mt: 1 }}
                          />
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" color="textSecondary">Top Drivers</Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {varianceAnalysis.summary.topDrivers?.map((driver, idx) => (
                              <Chip
                                key={idx}
                                label={`${driver.metric}: ${formatPercent(driver.variance)}`}
                                variant="outlined"
                                color={getVarianceColor(driver.variance)}
                              />
                            ))}
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {varianceAnalysis.suggestedReasonCodes?.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Suggested Reason Codes</Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Based on the variance patterns, these reason codes may be applicable
                    </Alert>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {(varianceAnalysis?.suggestedReasonCodes || []).map((code) => (
                        <Chip
                          key={code.id || code._id}
                          label={`${code.code}: ${code.name}`}
                          variant="outlined"
                          onClick={() => {
                            setSelectedReasonCode(code.id || code._id);
                            setTagDialogOpen(true);
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {varianceReport && (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Variance by Reason Code (Last 90 Days)</Typography>
                    <Box sx={{ height: 300 }}>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={10} />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar dataKey="count" fill="#8B5CF6" name="Count" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography color="textSecondary">No variance data available</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Reason Codes by Category</Typography>
                    <Box sx={{ height: 300 }}>
                      {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography color="textSecondary">No category data</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Variance Reason Codes</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={handleSeedDefaults}
                >
                  Seed Defaults
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCodeDialogOpen(true)}
                >
                  Add Code
                </Button>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Reason codes help standardize variance explanations across the organization.
              Use consistent codes to enable trend analysis and root cause identification.
            </Alert>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Usage Count</TableCell>
                    <TableCell>System</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reasonCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary" sx={{ py: 4 }}>
                          No reason codes found. Click "Seed Defaults" to add standard codes.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reasonCodes.map((code) => (
                      <TableRow key={code.id || code._id}>
                        <TableCell>
                          <Chip label={code.code} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="medium">{code.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatLabel(code.category)}
                            size="small"
                            sx={{
                              bgcolor: VARIANCE_CATEGORIES.find((c) => c.value === code.category)?.color + '20',
                              color: VARIANCE_CATEGORIES.find((c) => c.value === code.category)?.color
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {code.description}
                          </Typography>
                        </TableCell>
                        <TableCell>{code.usageCount || 0}</TableCell>
                        <TableCell>
                          {code.isSystemDefined ? (
                            <Chip label="System" size="small" color="primary" />
                          ) : (
                            <Chip label="Custom" size="small" variant="outlined" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tag Variance with Reason Code</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Reason Code"
            value={selectedReasonCode}
            onChange={(e) => setSelectedReasonCode(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          >
            {reasonCodes.map((code) => (
              <MenuItem key={code.id || code._id} value={code.id || code._id}>
                <Box>
                  <Typography>{code.code}: {code.name}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {code.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Additional Notes"
            multiline
            rows={3}
            value={tagNotes}
            onChange={(e) => setTagNotes(e.target.value)}
            placeholder="Add any additional context about this variance..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitTag}>
            Tag Variance
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={codeDialogOpen} onClose={() => setCodeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Reason Code</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Code"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                placeholder="e.g., CUSTOM_01"
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Name"
                value={newCode.name}
                onChange={(e) => setNewCode({ ...newCode, name: e.target.value })}
                placeholder="e.g., Custom Variance Reason"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Category"
                value={newCode.category}
                onChange={(e) => setNewCode({ ...newCode, category: e.target.value })}
              >
                {VARIANCE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newCode.description}
                onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                placeholder="Describe when this reason code should be used..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCode}>
            Create Code
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VarianceAnalysisPage;
