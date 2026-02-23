import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  PredictiveAnalytics,
  AutoGraph,
  Refresh,
  Download,
  Info,
  PlayArrow,
  Assessment
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import { formatLabel } from '../../utils/formatters';

const MLDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [predictions, setPredictions] = useState({});
  const [models, setModels] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [predictionResults, setPredictionResults] = useState(null);
  const [modelMetrics, setModelMetrics] = useState({});
  const [trainingStatus, setTrainingStatus] = useState({});
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, type: '', data: null });

  useEffect(() => {
    loadInitialData();
    loadModelStatus();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load customers and products for predictions
      const [customersRes, productsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products')
      ]);
      
      setCustomers(customersRes.data.slice(0, 50)); // Limit for demo
      setProducts(productsRes.data.slice(0, 50));
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadModelStatus = async () => {
    try {
      const response = await api.get('/ml/models/status');
      setModels(response.data.models);
      setModelMetrics(response.data.metrics);
    } catch (error) {
      console.error('Error loading model status:', error);
    }
  };

  const runPrediction = async (type, params) => {
    setLoading(true);
    try {
      const response = await api.post(`/ml/predict/${type}`, params);
      setPredictionResults({
        type,
        ...response.data
      });
    } catch (error) {
      console.error('Error running prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async (modelType) => {
    setTrainingStatus(prev => ({ ...prev, [modelType]: 'training' }));
    try {
      const response = await api.post(`/ml/train/${modelType}`);
      setTrainingStatus(prev => ({ ...prev, [modelType]: 'completed' }));
      loadModelStatus(); // Refresh model status
    } catch (error) {
      console.error('Error training model:', error);
      setTrainingStatus(prev => ({ ...prev, [modelType]: 'error' }));
    }
  };

  const getModelStatusColor = (status) => {
    switch (status) {
      case 'trained': return 'success';
      case 'training': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const formatConfidence = (confidence) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ml-tabpanel-${index}`}
      aria-labelledby={`ml-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  const renderCLVPrediction = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Lifetime Value Prediction
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Customer</InputLabel>
              <Select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                label="Select Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => runPrediction('clv', { customerId: selectedCustomer })}
              disabled={!selectedCustomer || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PredictiveAnalytics />}
              fullWidth
            >
              Predict CLV
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        {predictionResults && predictionResults.type === 'clv' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CLV Prediction Results
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color="primary">
                  R{predictionResults.prediction?.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Predicted Customer Lifetime Value
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Confidence: {formatConfidence(predictionResults.confidence)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={predictionResults.confidence * 100}
                  sx={{ mt: 1 }}
                />
              </Box>
              <Typography variant="body2" color="textSecondary">
                Risk Level: {predictionResults.riskLevel}
              </Typography>
              <Chip
                label={predictionResults.riskLevel}
                color={predictionResults.riskLevel === 'Low' ? 'success' : 
                       predictionResults.riskLevel === 'Medium' ? 'warning' : 'error'}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderChurnPrediction = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Churn Prediction
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Customer</InputLabel>
              <Select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                label="Select Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => runPrediction('churn', { customerId: selectedCustomer })}
              disabled={!selectedCustomer || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}
              fullWidth
            >
              Predict Churn Risk
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        {predictionResults && predictionResults.type === 'churn' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Churn Prediction Results
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color={predictionResults.churnProbability > 0.7 ? 'error' : 'primary'}>
                  {formatConfidence(predictionResults.churnProbability)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Churn Probability
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Risk Level: {predictionResults.riskLevel}
                </Typography>
                <Chip
                  label={predictionResults.riskLevel}
                  color={predictionResults.riskLevel === 'Low' ? 'success' : 
                         predictionResults.riskLevel === 'Medium' ? 'warning' : 'error'}
                  size="small"
                />
              </Box>
              {predictionResults.retentionStrategies && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Recommended Retention Strategies:
                  </Typography>
                  {(predictionResults?.retentionStrategies || []).map((strategy, index) => (
                    <Chip
                      key={index}
                      label={strategy}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderDemandForecasting = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Demand Forecasting
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Product</InputLabel>
              <Select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                label="Select Product"
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => runPrediction('demand', { productId: selectedProduct })}
              disabled={!selectedProduct || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AutoGraph />}
              fullWidth
            >
              Forecast Demand
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        {predictionResults && predictionResults.type === 'demand' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Demand Forecast Results
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={predictionResults.forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="predicted" stroke="#8884d8" name="Predicted Demand" />
                  <Line type="monotone" dataKey="confidence_lower" stroke="#82ca9d" strokeDasharray="5 5" name="Lower Bound" />
                  <Line type="monotone" dataKey="confidence_upper" stroke="#82ca9d" strokeDasharray="5 5" name="Upper Bound" />
                </LineChart>
              </ResponsiveContainer>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                30-day demand forecast with confidence intervals
              </Typography>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderPriceOptimization = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Price Optimization
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Product</InputLabel>
              <Select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                label="Select Product"
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => runPrediction('price', { productId: selectedProduct })}
              disabled={!selectedProduct || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
              fullWidth
            >
              Optimize Price
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        {predictionResults && predictionResults.type === 'price' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Optimization Results
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" color="primary">
                  R{predictionResults.optimalPrice?.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Optimal Price
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Expected Revenue Increase: {predictionResults.revenueIncrease?.toFixed(1)}%
                </Typography>
                <Typography variant="body2">
                  Price Elasticity: {predictionResults.elasticity?.toFixed(2)}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={predictionResults.priceAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8884d8" name="Expected Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderRecommendations = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Product Recommendations
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Customer</InputLabel>
              <Select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                label="Select Customer"
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => runPrediction('recommendations', { customerId: selectedCustomer })}
              disabled={!selectedCustomer || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Psychology />}
              fullWidth
            >
              Get Recommendations
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        {predictionResults && predictionResults.type === 'recommendations' && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommended Products
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {predictionResults.recommendations?.map((rec, index) => (
                      <TableRow key={index}>
                        <TableCell>{rec.productName}</TableCell>
                        <TableCell>
                          <Chip
                            label={formatConfidence(rec.score)}
                            color={rec.score > 0.8 ? 'success' : rec.score > 0.6 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{rec.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderModelManagement = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Model Status & Management
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Accuracy</TableCell>
                    <TableCell>Last Trained</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(models).map(([modelName, modelData]) => (
                    <TableRow key={modelName}>
                      <TableCell>{formatLabel(modelName)}</TableCell>
                      <TableCell>
                        <Chip
                          label={modelData.status}
                          color={getModelStatusColor(modelData.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {modelData.accuracy ? `${(modelData.accuracy * 100).toFixed(1)}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {modelData.lastTrained ? new Date(modelData.lastTrained).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => trainModel(modelName)}
                          disabled={trainingStatus[modelName] === 'training'}
                          startIcon={trainingStatus[modelName] === 'training' ? <CircularProgress size={16} /> : <PlayArrow />}
                        >
                          {trainingStatus[modelName] === 'training' ? 'Training...' : 'Retrain'}
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => setDetailsDialog({ open: true, type: modelName, data: modelData })}
                        >
                          <Info />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {Object.keys(modelMetrics).length > 0 && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Model Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(modelMetrics).map(([modelName, metrics]) => (
                  <Grid item xs={12} sm={6} md={4} key={modelName}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {modelName.toUpperCase()}
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {(metrics.accuracy * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Accuracy
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          Precision: {(metrics.precision * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          Recall: {(metrics.recall * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Machine Learning Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadModelStatus}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
          >
            Export Results
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="CLV Prediction" />
          <Tab label="Churn Analysis" />
          <Tab label="Demand Forecasting" />
          <Tab label="Price Optimization" />
          <Tab label="Recommendations" />
          <Tab label="Model Management" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderCLVPrediction()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderChurnPrediction()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderDemandForecasting()}
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        {renderPriceOptimization()}
      </TabPanel>
      <TabPanel value={activeTab} index={4}>
        {renderRecommendations()}
      </TabPanel>
      <TabPanel value={activeTab} index={5}>
        {renderModelManagement()}
      </TabPanel>

      {/* Model Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, type: '', data: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formatLabel(detailsDialog.type)} Model Details
        </DialogTitle>
        <DialogContent>
          {detailsDialog.data && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> {detailsDialog.data.status}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Accuracy:</strong> {detailsDialog.data.accuracy ? `${(detailsDialog.data.accuracy * 100).toFixed(2)}%` : 'N/A'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Last Trained:</strong> {detailsDialog.data.lastTrained ? new Date(detailsDialog.data.lastTrained).toLocaleString() : 'Never'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Training Data Size:</strong> {detailsDialog.data.trainingDataSize || 'N/A'} records
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Model Version:</strong> {detailsDialog.data.version || '1.0'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, type: '', data: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MLDashboard;
