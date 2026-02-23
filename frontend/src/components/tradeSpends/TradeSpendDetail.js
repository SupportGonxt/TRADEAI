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
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

import { PageHeader, StatusChip, ConfirmDialog } from '../common';
import { tradeSpendService, budgetService } from '../../services/api';
import { formatCurrency, formatLabel } from '../../utils/formatters';
import TradeSpendForm from './TradeSpendForm';
import { useToast } from '../common/ToastNotification';
import analytics from '../../utils/analytics';


const TradeSpendDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [tradeSpend, setTradeSpend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [budgets, setBudgets] = useState([]);

  // Fetch trade spend on component mount
  useEffect(() => {
    fetchTradeSpend();
    fetchBudgets();
  }, [id]);

  // Fetch trade spend from API
  const fetchTradeSpend = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await tradeSpendService.getById(id);
      setTradeSpend(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error.message || "An error occurred");
      setLoading(false);
    }
  };

  // Fetch budgets from API
  const fetchBudgets = async () => {
    try {
      // In a real app, we would call the API
      const response = await budgetService.getAll();
      setBudgets(response.data);    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditTradeSpend = () => {
    analytics.trackEvent('trade_spend_edit_clicked', { tradeSpendId: id });
    navigate(`/trade-spends/${id}/edit`);
  };

  const handleDeleteTradeSpend = () => {
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    
    try {
      await tradeSpendService.delete(id);
      analytics.trackEvent('trade_spend_deleted', { tradeSpendId: id });
      toast.success('Trade spend deleted successfully!');
      setDeleteLoading(false);
      setOpenDeleteDialog(false);
      navigate('/trade-spends');
    } catch (err) {
      console.error('Failed to delete trade spend:', err);
      const errorMsg = err.message || 'Failed to delete trade spend';
      toast.error(errorMsg);
      setDeleteLoading(false);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (tradeSpendData) => {
    try {
      // In a real app, we would call the API
      // await tradeSpendService.update(id, tradeSpendData);
      
      // Refresh trade spend
      fetchTradeSpend();
      setOpenEditForm(false);
    } catch (error) {
      console.error('Error updating trade spend:', error);
      setError(error.message || "An error occurred");
    }
  };

  // Format currency
  // Remove local formatCurrency function - using imported one

  // Format date
  const formatDate = (date) => {
    return format(new Date(date), 'MMM d, yyyy');
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
          onClick={() => navigate('/trade-spends')}
          sx={{ mt: 2 }}
        >
          Back to Trade Spends
        </Button>
      </Box>
    );
  }

  if (!tradeSpend) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">Trade spend not found.</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/trade-spends')}
          sx={{ mt: 2 }}
        >
          Back to Trade Spends
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Trade Spend: ${tradeSpend.description}`}
        subtitle={`Trade Spend ID: ${tradeSpend.id}`}
        breadcrumbs={[
          { text: 'Trade Spends', link: '/trade-spends' },
          { text: tradeSpend.description }
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/trade-spends')}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditTradeSpend}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteTradeSpend}
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
                Trade Spend Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Description
                    </Typography>
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    {tradeSpend.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Type
                    </Typography>
                  </Box>
                  <Typography variant="body1" gutterBottom>
                    {formatLabel(tradeSpend.spendType || tradeSpend.type || 'N/A')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Amount
                    </Typography>
                  </Box>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {formatCurrency(tradeSpend.amount)}
                  </Typography>
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
                    {(tradeSpend.startDate || tradeSpend.start_date) ? formatDate(tradeSpend.startDate || tradeSpend.start_date) : 'N/A'} - {(tradeSpend.endDate || tradeSpend.end_date) ? formatDate(tradeSpend.endDate || tradeSpend.end_date) : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <StatusChip status={tradeSpend.status} />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Budget
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {tradeSpend.customerName || tradeSpend.budget?.customer?.name || 'N/A'}{tradeSpend.budget?.year ? ` (${tradeSpend.budget.year})` : ''}
                  </Typography>
                  {(tradeSpend.budgetId || tradeSpend.budget?.id) && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/budgets/${tradeSpend.budgetId || tradeSpend.budget?.id}`)}
                      sx={{ mt: 1 }}
                    >
                      View Budget
                    </Button>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {tradeSpend.notes && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2">
                  {tradeSpend.notes}
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
              <Tab label="Performance" />
              <Tab label="Activity Log" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Products
                  </Typography>
                  
                  {tradeSpend.products && tradeSpend.products.length > 0 ? (
                    <List>
                      {(tradeSpend?.products || []).map((product) => (
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
                      No products associated with this trade spend.
                    </Alert>
                  )}
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Performance
                  </Typography>
                  <Alert severity="info">
                    Performance metrics feature coming soon.
                  </Alert>
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Activity Log
                  </Typography>
                  <Alert severity="info">
                    Activity log feature coming soon.
                  </Alert>
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
                    {formatDate(tradeSpend.createdAt || tradeSpend.created_at)}
                  </Typography>
                  <Typography variant="body1">
                    Trade spend created
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
                    {formatDate(tradeSpend.updatedAt || tradeSpend.updated_at)}
                  </Typography>
                  <Typography variant="body1">
                    Status changed to {formatLabel(tradeSpend.status)}
                  </Typography>
                </Box>
                
                {(tradeSpend.startDate || tradeSpend.start_date) && (
                <Box sx={{ mb: 3, position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: -14, 
                    top: 0, 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: 'grey.400' 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(tradeSpend.startDate || tradeSpend.start_date)}
                  </Typography>
                  <Typography variant="body1">
                    Scheduled start date
                  </Typography>
                </Box>
                )}
                
                {(tradeSpend.endDate || tradeSpend.end_date) && (
                <Box sx={{ position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    left: -14, 
                    top: 0, 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: 'grey.400' 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(tradeSpend.endDate || tradeSpend.end_date)}
                  </Typography>
                  <Typography variant="body1">
                    Scheduled end date
                  </Typography>
                </Box>
                )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Trade Spend Form */}
      {openEditForm && (
        <TradeSpendForm
          open={openEditForm}
          onClose={() => setOpenEditForm(false)}
          onSubmit={handleFormSubmit}
          tradeSpend={tradeSpend}
          budgets={budgets}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Trade Spend"
        message="Are you sure you want to delete this trade spend? This action cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        loading={deleteLoading}
      />
    </Box>
  );
};

export default TradeSpendDetail;
