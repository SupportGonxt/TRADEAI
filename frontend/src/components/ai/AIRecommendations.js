import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Slider,
  Switch,
  FormControlLabel,
  LinearProgress
} from '@mui/material';
import {
  ShoppingCart,
  LocalOffer,
  Share,
  Refresh,
  FilterList,
  ViewList,
  ViewModule,
  Psychology,
  Group,
  Schedule
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AIRecommendations = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Recommendations state
  const [productRecommendations, setProductRecommendations] = useState([]);
  const [personalizedPromotions, setPersonalizedPromotions] = useState([]);
  const [customerSegmentation, setCustomerSegmentation] = useState(null);
  const [hybridRecommendations, setHybridRecommendations] = useState([]);
  const [realTimeRecommendations, setRealTimeRecommendations] = useState([]);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('user123');
  const [recommendationFilters, setRecommendationFilters] = useState({
    limit: 10,
    category: '',
    priceRange: [0, 1000],
    includeReasons: true,
    diversityFactor: 0.3
  });

  const [promotionFilters, setPromotionFilters] = useState({
    limit: 5,
    budget: null,
    channel: '',
    timeframe: 30
  });

  const [hybridWeights, setHybridWeights] = useState({
    collaborative: 0.4,
    content: 0.3,
    popularity: 0.2,
    personal: 0.1
  });

  const [realTimeContext, setRealTimeContext] = useState({
    currentPage: 'homepage',
    currentProduct: null,
    cartItems: [],
    sessionData: { duration: 0 }
  });

  // Sample customer data for segmentation
  const [customerData, setCustomerData] = useState({
    customerId: 'CUST001',
    age: 32,
    income: 65000,
    totalPurchases: 45,
    avgOrderValue: 125,
    daysSinceLastPurchase: 12,
    purchaseFrequency: 8,
    categoriesPurchased: 5,
    emailEngagement: 0.8,
    mobileUsage: 0.9,
    tenureMonths: 24,
    supportInteractions: 2,
    satisfactionScore: 0.85,
    referralsMade: 3,
    socialEngagement: 0.7,
    loyaltyPoints: 2500
  });

  useEffect(() => {
    // Load initial recommendations
    getProductRecommendations();
    getPersonalizedPromotions();
    segmentCustomer();
  }, [selectedUserId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Product Recommendations
  const getProductRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/ai/recommendations/products', {
        userId: selectedUserId,
        filters: recommendationFilters
      });

      setProductRecommendations(response.data.recommendations || []);
    } catch (error) {
      setError('Failed to get product recommendations');
      console.error('Error getting product recommendations:', error);
      setProductRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // Personalized Promotions
  const getPersonalizedPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/ai/recommendations/promotions', {
        userId: selectedUserId,
        filters: promotionFilters
      });

      setPersonalizedPromotions(response.data.promotions || []);
    } catch (error) {
      setError('Failed to get personalized promotions');
      console.error('Error getting personalized promotions:', error);
      setPersonalizedPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  // Customer Segmentation
  const segmentCustomer = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/ai/segmentation/customer', {
        customerData
      });

      setCustomerSegmentation(response.data.segmentation || null);
    } catch (error) {
      setError('Failed to segment customer');
      console.error('Error segmenting customer:', error);
      setCustomerSegmentation(null);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };



  const ProductCard = ({ product, showReasons = true }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="div" noWrap>
            {product.name || `Product ${product.id}`}
          </Typography>
          <Chip
            label={`${(product.score * 100).toFixed(0)}%`}
            color={getScoreColor(product.score)}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {product.category || 'Electronics'}
        </Typography>
        
        <Typography variant="h6" color="primary" gutterBottom>
          {formatCurrency(product.price || 99.99)}
        </Typography>
        
        <Box display="flex" alignItems="center" mb={1}>
          <Rating value={product.rating || 4.2} precision={0.1} size="small" readOnly />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({product.reviews || 127})
          </Typography>
        </Box>
        
        {showReasons && product.reasons && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Why recommended:
            </Typography>
            {product.reasons.slice(0, 2).map((reason, index) => (
              <Chip
                key={index}
                label={reason}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}
      </CardContent>
      
      <Box p={2} pt={0}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<ShoppingCart />}
          size="small"
        >
          Add to Cart
        </Button>
      </Box>
    </Card>
  );

  const PromotionCard = ({ promotion }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="between" alignItems="flex-start">
          <Box flexGrow={1}>
            <Typography variant="h6" gutterBottom>
              {promotion.title || 'Special Offer'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {promotion.description || 'Limited time offer just for you!'}
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              <Chip
                label={`${promotion.discount || 20}% OFF`}
                color="primary"
                size="small"
              />
              <Chip
                label={`Score: ${(promotion.score * 100).toFixed(0)}%`}
                color={getScoreColor(promotion.score)}
                size="small"
              />
            </Box>
            {promotion.personalization && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Personalized for you:
                </Typography>
                <Typography variant="body2">
                  {promotion.personalization.reason}
                </Typography>
              </Box>
            )}
          </Box>
          <Box textAlign="right">
            <Typography variant="h6" color="primary">
              {formatCurrency(promotion.value || 50)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Savings
            </Typography>
          </Box>
        </Box>
        <Box mt={2} display="flex" gap={1}>
          <Button variant="contained" size="small" startIcon={<LocalOffer />}>
            Claim Offer
          </Button>
          <Button variant="outlined" size="small" startIcon={<Share />}>
            Share
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          AI Recommendations
        </Typography>
        <Box display="flex" gap={1}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>User ID</InputLabel>
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              label="User ID"
            >
              <MenuItem value="user123">User 123</MenuItem>
              <MenuItem value="user456">User 456</MenuItem>
              <MenuItem value="user789">User 789</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
          </IconButton>
          <IconButton onClick={() => setFilterDialogOpen(true)}>
            <FilterList />
          </IconButton>
          <IconButton onClick={() => window.location.reload()}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Recommendation Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Product Recommendations" icon={<ShoppingCart />} />
          <Tab label="Personalized Promotions" icon={<LocalOffer />} />
          <Tab label="Customer Segmentation" icon={<Group />} />
          <Tab label="Hybrid Recommendations" icon={<Psychology />} />
          <Tab label="Real-time Context" icon={<Schedule />} />
        </Tabs>

        {/* Product Recommendations Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Product Recommendations for {selectedUserId}
              </Typography>
              <Button
                variant="contained"
                onClick={getProductRecommendations}
                disabled={loading}
                startIcon={<Refresh />}
              >
                Refresh
              </Button>
            </Box>
            
            {productRecommendations.length > 0 ? (
              <Grid container spacing={3}>
                {productRecommendations.map((product, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  {loading ? 'Loading recommendations...' : 'No recommendations available'}
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Personalized Promotions Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Personalized Promotions
              </Typography>
              <Button
                variant="contained"
                onClick={getPersonalizedPromotions}
                disabled={loading}
                startIcon={<Refresh />}
              >
                Refresh
              </Button>
            </Box>
            
            {personalizedPromotions.length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  {personalizedPromotions.map((promotion, index) => (
                    <PromotionCard key={index} promotion={promotion} />
                  ))}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Promotion Performance
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={personalizedPromotions.map((p, i) => ({
                              name: p.title || `Promotion ${i + 1}`,
                              value: p.score * 100
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {personalizedPromotions.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  {loading ? 'Loading promotions...' : 'No promotions available'}
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Customer Segmentation Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Profile Input
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Age"
                        type="number"
                        value={customerData.age}
                        onChange={(e) => setCustomerData(prev => ({
                          ...prev,
                          age: parseInt(e.target.value)
                        }))}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Income"
                        type="number"
                        value={customerData.income}
                        onChange={(e) => setCustomerData(prev => ({
                          ...prev,
                          income: parseInt(e.target.value)
                        }))}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Total Purchases"
                        type="number"
                        value={customerData.totalPurchases}
                        onChange={(e) => setCustomerData(prev => ({
                          ...prev,
                          totalPurchases: parseInt(e.target.value)
                        }))}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Avg Order Value"
                        type="number"
                        value={customerData.avgOrderValue}
                        onChange={(e) => setCustomerData(prev => ({
                          ...prev,
                          avgOrderValue: parseFloat(e.target.value)
                        }))}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      onClick={segmentCustomer}
                      disabled={loading}
                      startIcon={<Psychology />}
                    >
                      Analyze Segment
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Segmentation Results
                  </Typography>
                  {customerSegmentation ? (
                    <Box>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Primary Segment
                        </Typography>
                        <Chip
                          label={customerSegmentation.primarySegment}
                          color="primary"
                          size="large"
                        />
                      </Box>
                      
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Confidence
                        </Typography>
                        <Box display="flex" alignItems="center">
                          <Box flexGrow={1} mr={1}>
                            <LinearProgress
                              variant="determinate"
                              value={customerSegmentation.confidence * 100}
                              color={getScoreColor(customerSegmentation.confidence)}
                            />
                          </Box>
                          <Typography variant="body2">
                            {(customerSegmentation.confidence * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        All Segments
                      </Typography>
                      {customerSegmentation.allSegments.slice(0, 4).map((segment, index) => (
                        <Box key={index} mb={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2">{segment.segment}</Typography>
                            <Typography variant="body2">
                              {(segment.probability * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={segment.probability * 100}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      ))}
                      
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Recommendations
                        </Typography>
                        {(customerSegmentation?.recommendations || []).map((rec, index) => (
                          <Chip key={index} label={rec} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">
                      Analyze customer to see segmentation results
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Hybrid Recommendations Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Hybrid Recommendation System
          </Typography>
          <Typography color="text.secondary">
            This tab would show hybrid recommendations combining multiple AI approaches.
          </Typography>
        </TabPanel>

        {/* Real-time Context Tab */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>
            Real-time Contextual Recommendations
          </Typography>
          <Typography color="text.secondary">
            This tab would show context-aware recommendations based on user's current session.
          </Typography>
        </TabPanel>
      </Paper>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Recommendation Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Product Recommendations
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Limit"
                    type="number"
                    value={recommendationFilters.limit}
                    onChange={(e) => setRecommendationFilters(prev => ({
                      ...prev,
                      limit: parseInt(e.target.value)
                    }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={recommendationFilters.category}
                      onChange={(e) => setRecommendationFilters(prev => ({
                        ...prev,
                        category: e.target.value
                      }))}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      <MenuItem value="electronics">Electronics</MenuItem>
                      <MenuItem value="clothing">Clothing</MenuItem>
                      <MenuItem value="home">Home & Garden</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography gutterBottom>Price Range</Typography>
                  <Slider
                    value={recommendationFilters.priceRange}
                    onChange={(e, value) => setRecommendationFilters(prev => ({
                      ...prev,
                      priceRange: value
                    }))}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    step={10}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={recommendationFilters.includeReasons}
                        onChange={(e) => setRecommendationFilters(prev => ({
                          ...prev,
                          includeReasons: e.target.checked
                        }))}
                      />
                    }
                    label="Include Reasons"
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Advanced Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography gutterBottom>Diversity Factor</Typography>
                  <Slider
                    value={recommendationFilters.diversityFactor}
                    onChange={(e, value) => setRecommendationFilters(prev => ({
                      ...prev,
                      diversityFactor: value
                    }))}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setFilterDialogOpen(false);
              // Refresh recommendations with new filters
              if (activeTab === 0) getProductRecommendations();
            }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIRecommendations;
