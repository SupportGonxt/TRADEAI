import React, {useState} from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Psychology,
  PlayArrow,
  Save,
  Info
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import enterpriseApi from '../../../services/enterpriseApi';

const promotionTypes = [
  { value: 'discount', label: 'Discount Promotion' },
  { value: 'bogo', label: 'Buy One Get One' },
  { value: 'bundle', label: 'Bundle Deal' },
  { value: 'rebate', label: 'Mail-in Rebate' }
];

export default function PromotionSimulator({ onSaveScenario }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const [inputs, setInputs] = useState({
    promotionType: 'discount',
    discountPercent: 15,
    duration: 30,
    targetProducts: [],
    scenarioName: ''
  });

  const handleSliderChange = (field) => (event, newValue) => {
    setInputs({ ...inputs, [field]: newValue });
    setResults(null); // Clear results when inputs change
  };

  const handleInputChange = (field) => (event) => {
    setInputs({ ...inputs, [field]: event.target.value });
    setResults(null);
  };

  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await enterpriseApi.simulations.promotionImpact({
        promotionType: inputs.promotionType,
        discountPercent: inputs.discountPercent,
        duration: inputs.duration,
        targetProducts: inputs.targetProducts
      });

      setResults(response.data);
    } catch (err) {
      console.error('Simulation failed:', err);
      setError(err.error?.message || 'Simulation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (results && inputs.scenarioName) {
      onSaveScenario({
        type: 'promotion',
        name: inputs.scenarioName,
        inputs,
        results
      });
      setInputs({ ...inputs, scenarioName: '' });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const prepareSensitivityData = () => {
    if (!results?.sensitivityAnalysis) return null;

    const discountData = results.sensitivityAnalysis.discount?.variations.map(v => ({
      variation: `${v.variation > 0 ? '+' : ''}${v.variation}%`,
      impact: v.result
    })) || [];

    const durationData = results.sensitivityAnalysis.duration?.variations.map(v => ({
      variation: `${v.variation > 0 ? '+' : ''}${v.variation} days`,
      impact: v.result
    })) || [];

    return { discountData, durationData };
  };

  const sensitivityData = results ? prepareSensitivityData() : null;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Input Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Simulation Inputs
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Promotion Type</InputLabel>
              <Select
                value={inputs.promotionType}
                onChange={handleInputChange('promotionType')}
                label="Promotion Type"
              >
                {promotionTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                Discount Percentage
                <Tooltip title="The percentage discount to be applied">
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Slider
                value={inputs.discountPercent}
                onChange={handleSliderChange('discountPercent')}
                min={0}
                max={50}
                step={1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' }
                ]}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                Duration (Days)
                <Tooltip title="How long the promotion will run">
                  <IconButton size="small">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Slider
                value={inputs.duration}
                onChange={handleSliderChange('duration')}
                min={7}
                max={90}
                step={1}
                marks={[
                  { value: 7, label: '1w' },
                  { value: 30, label: '1m' },
                  { value: 90, label: '3m' }
                ]}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value} days`}
              />
            </Box>

            <TextField
              fullWidth
              label="Scenario Name (optional)"
              value={inputs.scenarioName}
              onChange={handleInputChange('scenarioName')}
              placeholder="e.g., Spring Sale 2025"
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
              onClick={runSimulation}
              disabled={loading}
              sx={{ mb: 1 }}
            >
              {loading ? 'Running Simulation...' : 'Run Simulation'}
            </Button>

            {results && inputs.scenarioName && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Save />}
                onClick={handleSave}
              >
                Save Scenario
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={8}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Analyzing promotion impact...</Typography>
              <LinearProgress sx={{ mt: 2 }} />
            </Paper>
          )}

          {!loading && !results && !error && (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Psychology sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Configure your promotion parameters
              </Typography>
              <Typography color="text.secondary">
                Adjust the settings on the left and click "Run Simulation" to see projected results
              </Typography>
            </Paper>
          )}

          {!loading && results && (
            <Box>
              {/* KPI Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Revenue Uplift
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatPercent(results.predicted.uplift.revenue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(results.predicted.revenue)} projected
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Volume Uplift
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                        {formatPercent(results.predicted.uplift.volume)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {results.predicted.volume.toLocaleString()} units
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" variant="body2">
                        Margin Impact
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 600, 
                          color: results.predicted.uplift.margin > 0 ? 'success.main' : 'warning.main'
                        }}
                      >
                        {formatPercent(results.predicted.uplift.margin)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(results.predicted.margin)} projected
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Financial Impact */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Financial Impact
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography color="text.secondary" variant="body2">Incremental Revenue</Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(results.financial.incrementalRevenue)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography color="text.secondary" variant="body2">Incremental Margin</Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(results.financial.incrementalMargin)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography color="text.secondary" variant="body2">Baseline Revenue</Typography>
                    <Typography variant="h6">
                      {formatCurrency(results.baseline.revenue)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography color="text.secondary" variant="body2">Confidence</Typography>
                    <Typography variant="h6">
                      {(results.confidence * 100).toFixed(0)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Recommendations */}
              {results.recommendations && results.recommendations.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    AI Recommendations
                  </Typography>
                  {(results?.recommendations || []).map((rec, index) => (
                    <Alert 
                      key={index} 
                      severity={rec.type === 'positive' ? 'success' : rec.type === 'warning' ? 'warning' : 'info'}
                      sx={{ mb: 1 }}
                    >
                      {rec.message} <Chip label={`${rec.confidence} confidence`} size="small" sx={{ ml: 1 }} />
                    </Alert>
                  ))}
                </Paper>
              )}

              {/* Sensitivity Analysis */}
              {sensitivityData && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Sensitivity Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Discount Sensitivity
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={sensitivityData.discountData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="variation" />
                          <YAxis />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="impact" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Duration Sensitivity
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={sensitivityData.durationData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="variation" />
                          <YAxis />
                          <RechartsTooltip />
                          <Area type="monotone" dataKey="impact" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
