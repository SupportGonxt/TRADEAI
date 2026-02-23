import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert
} from '@mui/material';
import { PlayArrow, CompareArrows, TrendingUp } from '@mui/icons-material';
import api from '../../services/api';

const SimulationDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [comparisonResults, setComparisonResults] = useState(null);

  const runSimulation = async (scenarioType) => {
    setLoading(true);
    try {
      const response = await api.post('/simulation/run', {
        scenarioType,
        baseData: {
          dailyRevenue: 100000,
          dailyVolume: 5000,
          marginPercent: 35
        },
        days: 30
      });
      
      if (response.data.success) {
        setSimulationResults(response.data.data);
      }
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async () => {
    setLoading(true);
    try {
      const response = await api.post('/simulation/compare', {
        baseData: {
          dailyRevenue: 100000,
          dailyVolume: 5000,
          marginPercent: 35
        }
      });
      
      if (response.data.success) {
        setComparisonResults(response.data.data);
      }
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Business Simulation & Forecasting
        </Typography>
        <Typography variant="body1" color="text.secondary">
          30-day scenario modeling and AI-powered forecasts
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<TrendingUp />}
            onClick={() => runSimulation('positive')}
            disabled={loading}
          >
            Positive Scenario
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<TrendingUp />}
            onClick={() => runSimulation('negative')}
            disabled={loading}
          >
            Negative Scenario
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={() => runSimulation('baseline')}
            disabled={loading}
          >
            Baseline Scenario
          </Button>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CompareArrows />}
            onClick={runComparison}
            disabled={loading}
          >
            Compare All
          </Button>
        </Grid>
      </Grid>

      {/* Results */}
      {simulationResults && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {simulationResults.scenarioName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {simulationResults.description}
              </Typography>
              
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Revenue
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(simulationResults.summary.totalRevenue)}
                      </Typography>
                      <Chip
                        label={`${simulationResults.summary.revenueGrowth.toFixed(1)}%`}
                        color={simulationResults.summary.revenueGrowth > 0 ? 'success' : 'error'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Profit
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(simulationResults.summary.totalProfit)}
                      </Typography>
                      <Typography variant="caption">
                        ROI: {simulationResults.summary.roi}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Avg Net Margin
                      </Typography>
                      <Typography variant="h5">
                        {simulationResults.summary.avgNetMargin}%
                      </Typography>
                      <Chip
                        label={`${simulationResults.summary.marginChange > 0 ? '+' : ''}${simulationResults.summary.marginChange.toFixed(1)}%`}
                        color={simulationResults.summary.marginChange > 0 ? 'success' : 'error'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Rebates
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(simulationResults.summary.totalRebates)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Recommendations */}
              {simulationResults.recommendations && simulationResults.recommendations.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    AI Recommendations
                  </Typography>
                  {(simulationResults?.recommendations || []).map((rec, index) => (
                    <Alert
                      key={index}
                      severity={
                        rec.type === 'warning' ? 'warning' :
                        rec.type === 'insight' ? 'info' :
                        rec.type === 'suggestion' ? 'success' : 'info'
                      }
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle2">{rec.title}</Typography>
                      <Typography variant="body2">{rec.message}</Typography>
                      {rec.action && (
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          <strong>Action:</strong> {rec.action}
                        </Typography>
                      )}
                    </Alert>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Daily Results Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Breakdown (Last 7 Days)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Day</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Gross Profit</TableCell>
                      <TableCell align="right">Net Profit</TableCell>
                      <TableCell align="right">Net Margin</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {simulationResults.dailyResults.slice(-7).map((day) => (
                      <TableRow key={day.day}>
                        <TableCell>{day.day}</TableCell>
                        <TableCell>{day.date}</TableCell>
                        <TableCell align="right">{formatCurrency(day.revenue)}</TableCell>
                        <TableCell align="right">{formatCurrency(day.grossProfit)}</TableCell>
                        <TableCell align="right">{formatCurrency(day.netProfit)}</TableCell>
                        <TableCell align="right">{day.netMargin.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Comparison Results */}
      {comparisonResults && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scenario Comparison
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Positive</TableCell>
                    <TableCell align="right">Baseline</TableCell>
                    <TableCell align="right">Negative</TableCell>
                    <TableCell align="right">Variance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Revenue</TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.revenue.positive)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.revenue.baseline)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.revenue.negative)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.revenue.variance)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Profit</TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.profit.positive)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.profit.baseline)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.profit.negative)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(comparisonResults.comparison.profit.variance)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Avg Net Margin</TableCell>
                    <TableCell align="right">
                      {comparisonResults.comparison.margin.positive.toFixed(2)}%
                    </TableCell>
                    <TableCell align="right">
                      {comparisonResults.comparison.margin.baseline.toFixed(2)}%
                    </TableCell>
                    <TableCell align="right">
                      {comparisonResults.comparison.margin.negative.toFixed(2)}%
                    </TableCell>
                    <TableCell align="right">
                      {(comparisonResults.comparison.margin.positive - 
                        comparisonResults.comparison.margin.negative).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SimulationDashboard;
