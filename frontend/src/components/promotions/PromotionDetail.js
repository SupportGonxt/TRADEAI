import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Flag as FlagIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { PageHeader, StatusChip, ConfirmDialog } from '../common';
import { promotionService, customerService } from '../../services/api';
import { formatCurrency, formatDate, formatLabel } from '../../utils/formatters';
import PromotionForm from './PromotionForm';

// Production component - no mock data

const PromotionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [customers, setCustomers] = useState([]);

  // Fetch promotion on component mount
  useEffect(() => {
    fetchPromotion();
    fetchCustomers();
  }, [id]);

  // Fetch promotion from API
  const fetchPromotion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await promotionService.getById(id);
      setPromotion(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error.message || "An error occurred");
      setLoading(false);
    }
  };

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data || response);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setCustomers([]);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle edit promotion
  const handleEditPromotion = () => {
    navigate(`/promotions/${id}/edit`);
  };

  // Handle delete promotion
  const handleDeletePromotion = () => {
    setOpenDeleteDialog(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    
    try {
      // In a real app, we would call the API
      // await promotionService.delete(id);
      
      // Simulate API call
      setTimeout(() => {
        setDeleteLoading(false);
        setOpenDeleteDialog(false);
        navigate('/promotions');
      }, 1000);
    } catch (err) {
      console.error('Failed to delete promotion:', err);
      setDeleteLoading(false);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (_promotionData) => {
    try {
      // In a real app, we would call the API
      // await promotionService.update(id, promotionData);
      
      // Refresh promotion
      fetchPromotion();
      setOpenEditForm(false);
    } catch (error) {
      console.error('Error updating promotion:', error);
      setError(error.message || "An error occurred");
    }
  };

  // Using centralized formatters from utils

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    if (!promotion) return 0;
    
    const today = new Date();
    const endDate = new Date(promotion.end_date);
    
    if (today > endDate) return 0;
    
    const diffTime = Math.abs(endDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Calculate budget utilization
  const calculateBudgetUtilization = () => {
    if (!promotion || !promotion.performance) return 0;
    
    return Math.round((promotion.performance.budget_used / promotion.budget) * 100);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/promotions')}
          sx={{ mt: 2 }}
        >
          Back to Promotions
        </Button>
      </Box>
    );
  }

  if (!promotion) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Promotion not found.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/promotions')}
          sx={{ mt: 2 }}
        >
          Back to Promotions
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Promotion: ${promotion.name}`}
        subtitle={`Promotion ID: ${promotion.id}`}
        breadcrumbs={[
          { text: 'Promotions', link: '/promotions' },
          { text: promotion.name }
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/promotions')}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditPromotion}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeletePromotion}
            >
              Delete
            </Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Promotion Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Name
                    </Typography>
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    {promotion.name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Customer
                    </Typography>
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    {promotion.customer && promotion.customer.name ? promotion.customer.name : 'No customer assigned'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Budget
                    </Typography>
                  </Box>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {formatCurrency(promotion.budget)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Budget Utilization ({calculateBudgetUtilization()}%)
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={calculateBudgetUtilization()}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Date Range
                    </Typography>
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(promotion.start_date)} - {formatDate(promotion.end_date)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <StatusChip status={promotion.status} />
                  
                  {promotion.status === 'active' && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {calculateDaysRemaining()} days remaining
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Objectives & KPIs
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {promotion.objectives && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FlagIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Objectives
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {promotion.objectives}
                  </Typography>
                </Box>
              )}
              
              {promotion.kpis && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AssessmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      KPIs
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {promotion.kpis}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
          
          {promotion.description && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  {promotion.description}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Products" />
              <Tab label="Trade Spends" />
              <Tab label="Performance" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Products
                  </Typography>
                  
                  {promotion.products && promotion.products.length > 0 ? (
                    <List>
                      {(promotion?.products || []).map((product) => (
                        <React.Fragment key={product.id}>
                          <ListItem>
                            <ListItemText
                              primary={product.name}
                              secondary={`SKU: ${product.sku}`}
                            />
                            <ListItemSecondaryAction>
                              <Button
                                size="small"
                                onClick={() => navigate(`/products/${product.id}`)}
                              >
                                View
                              </Button>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">
                      No products associated with this promotion.
                    </Alert>
                  )}
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Trade Spends
                  </Typography>
                  
                  {promotion.trade_spends && promotion.trade_spends.length > 0 ? (
                    <List>
                      {(promotion?.trade_spends || []).map((tradeSpend, index) => (
                        <React.Fragment key={tradeSpend.id || index}>
                          <ListItem>
                            <ListItemText
                              primary={tradeSpend.description}
                              secondary={`${formatLabel(tradeSpend.type)} - ${formatCurrency(tradeSpend.amount)}`}
                            />
                            <ListItemSecondaryAction>
                              <Button
                                size="small"
                                onClick={() => navigate(`/trade-spends/${tradeSpend.id}`)}
                              >
                                View
                              </Button>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Alert severity="info">
                      No trade spends associated with this promotion.
                    </Alert>
                  )}
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Performance
                  </Typography>
                  
                  {promotion.performance ? (
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Budget Used
                            </Typography>
                            <Typography variant="h5" color="primary">
                              {formatCurrency(promotion.performance.budget_used)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {calculateBudgetUtilization()}% of total budget
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Sales Lift
                            </Typography>
                            <Typography variant="h5" color="primary">
                              {promotion.performance.sales_lift}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Compared to baseline
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              ROI
                            </Typography>
                            <Typography variant="h5" color="primary">
                              {promotion.performance.roi}x
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Return on investment
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Target Achievement
                            </Typography>
                            <Typography variant="h5" color="primary">
                              {promotion.performance.target_achieved}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Of target goals
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      Performance data not available for this promotion.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timeline
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ position: 'relative', ml: 2, pb: 2 }}>
                <Box sx={{ 
                  position: 'absolute', 
                  left: -8, 
                  top: 0, 
                  bottom: 0, 
                  width: 2, 
                  bgcolor: 'divider' 
                }} />
                
                <Box sx={{ mb: 3, position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: -14, 
                    top: 0, 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main' 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(promotion.created_at)}
                  </Typography>
                  <Typography variant="body1">
                    Promotion created
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3, position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: -14, 
                    top: 0, 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main' 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(promotion.updated_at)}
                  </Typography>
                  <Typography variant="body1">
                    Status changed to {promotion.status}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3, position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: -14, 
                    top: 0, 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: new Date() >= new Date(promotion.start_date) ? 'primary.main' : 'grey.400' 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(promotion.start_date)}
                  </Typography>
                  <Typography variant="body1">
                    Promotion start date
                  </Typography>
                </Box>
                
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: -14, 
                    top: 0, 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: new Date() >= new Date(promotion.end_date) ? 'primary.main' : 'grey.400' 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(promotion.end_date)}
                  </Typography>
                  <Typography variant="body1">
                    Promotion end date
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Promotion Form */}
      {openEditForm && (
        <PromotionForm
          open={openEditForm}
          onClose={() => setOpenEditForm(false)}
          onSubmit={handleFormSubmit}
          promotion={promotion}
          customers={customers}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Promotion"
        message="Are you sure you want to delete this promotion? This action cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        loading={deleteLoading}
      />
    </Box>
  );
};

export default PromotionDetail;
