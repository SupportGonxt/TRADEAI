import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Divider,
  Tooltip,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  AccountTree as HierarchyIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
// Removed TreeView import due to compatibility issues
import budgetService from '../../services/api/budgetService';

const HierarchicalBudgetManager = () => {
  const [budgetHierarchy, setBudgetHierarchy] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  // Removed expandedNodes state as TreeView is no longer used
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'allocate'
  const [formData, setFormData] = useState({
    name: '',
    type: 'department',
    parentId: null,
    totalBudget: 0,
    timeframe: 'annual',
    startDate: '',
    endDate: '',
    currency: 'USD',
    description: '',
    allocationType: 'percentage',
    children: []
  });

  const budgetTypes = [
    { value: 'company', label: 'Company Level' },
    { value: 'department', label: 'Department' },
    { value: 'brand', label: 'Brand' },
    { value: 'product', label: 'Product Line' },
    { value: 'channel', label: 'Sales Channel' },
    { value: 'region', label: 'Geographic Region' },
    { value: 'campaign', label: 'Marketing Campaign' }
  ];

  const timeframes = [
    { value: 'annual', label: 'Annual' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom Period' }
  ];

  const _allocationTypes = [
    { value: 'percentage', label: 'Percentage Based' },
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'performance', label: 'Performance Based' },
    { value: 'hybrid', label: 'Hybrid Model' }
  ];

  useEffect(() => {
    fetchBudgetHierarchy();
  }, []);

  const fetchBudgetHierarchy = async () => {
    setLoading(true);
    try {
      const response = await budgetService.getHierarchy();
      setBudgetHierarchy(response.data || response || []);
    } catch (error) {
      console.error('Error fetching budget hierarchy:', error);
      setBudgetHierarchy([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeSelect = (nodeId) => {
    const findNode = (nodes, id) => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const node = findNode(budgetHierarchy, nodeId);
    setSelectedNode(node);
  };

  // Removed handleNodeToggle as TreeView is no longer used

  const openCreateDialog = (parentId = null) => {
    setFormData({
      name: '',
      type: 'department',
      parentId,
      totalBudget: 0,
      timeframe: 'annual',
      startDate: '',
      endDate: '',
      currency: 'USD',
      description: '',
      allocationType: 'percentage',
      children: []
    });
    setDialogMode('create');
    setOpenDialog(true);
  };

  const openEditDialog = (node) => {
    setFormData({
      ...node,
      startDate: node.startDate || '',
      endDate: node.endDate || '',
      description: node.description || '',
      allocationType: node.allocationType || 'percentage'
    });
    setDialogMode('edit');
    setOpenDialog(true);
  };

  const openAllocationDialog = (node) => {
    setSelectedNode(node);
    setDialogMode('allocate');
    setOpenDialog(true);
  };

  const handleFormSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        // Create new budget node
        console.log('Creating budget node:', formData);
      } else if (dialogMode === 'edit') {
        // Update existing budget node
        console.log('Updating budget node:', formData);
      } else if (dialogMode === 'allocate') {
        // Handle budget allocation
        console.log('Allocating budget for node:', selectedNode);
      }
      
      setOpenDialog(false);
      await fetchBudgetHierarchy();
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const formatCurrency = (amount, currency = 'ZAR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateUtilization = (spent, allocated) => {
    return allocated > 0 ? (spent / allocated) * 100 : 0;
  };

  const getUtilizationColor = (utilization) => {
    if (utilization > 90) return 'error';
    if (utilization > 75) return 'warning';
    if (utilization > 50) return 'info';
    return 'success';
  };

  const renderTreeNode = (node, level = 0) => {
    const utilization = calculateUtilization(node.spent, node.allocated);
    
    return (
      <Box key={node.id} sx={{ mb: 1 }}>
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            ml: level * 3,
            cursor: 'pointer',
            borderLeft: level > 0 ? '3px solid #7C3AED' : 'none',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
          onClick={() => handleNodeSelect(node.id)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {node.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Chip 
                  label={node.type} 
                  size="small" 
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(node.allocated)} allocated
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(node.spent)} spent
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={utilization}
                color={getUtilizationColor(utilization)}
                sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Edit Budget">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEditDialog(node); }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Allocate Budget">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openAllocationDialog(node); }}>
                  <MoneyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add Child Budget">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openCreateDialog(node.id); }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
        {node.children && node.children.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </Box>
        )}
      </Box>
    );
  };

  const renderBudgetDetails = () => {
    if (!selectedNode) {
      return (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Budget Details
            </Typography>
            <Typography color="text.secondary">
              Select a budget node to view details
            </Typography>
          </CardContent>
        </Card>
      );
    }

    const utilization = calculateUtilization(selectedNode.spent, selectedNode.allocated);
    const remainingPercentage = ((selectedNode.remaining / selectedNode.allocated) * 100) || 0;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              {selectedNode.name}
            </Typography>
            <Chip 
              label={selectedNode.type} 
              color="primary" 
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Budget
                </Typography>
                <Typography variant="h4" color="primary">
                  {formatCurrency(selectedNode.totalBudget)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Allocated
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(selectedNode.allocated)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(selectedNode.allocated / selectedNode.totalBudget) * 100}
                  color="info"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Spent
                </Typography>
                <Typography variant="h6" color="error.main">
                  {formatCurrency(selectedNode.spent)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {utilization.toFixed(1)}% utilized
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Remaining
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(selectedNode.remaining)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {remainingPercentage.toFixed(1)}% available
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Unallocated
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {formatCurrency(selectedNode.totalBudget - selectedNode.allocated)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Available for allocation
                </Typography>
              </Box>
            </Grid>

            {selectedNode.children && selectedNode.children.length > 0 && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Child Budget Breakdown
                </Typography>
                {(selectedNode?.children || []).map(child => (
                  <Box key={child.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Typography variant="body2">{child.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(child.allocated)}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={calculateUtilization(child.spent, child.allocated)}
                        color={getUtilizationColor(calculateUtilization(child.spent, child.allocated))}
                        sx={{ width: 100, height: 4 }}
                      />
                    </Box>
                  </Box>
                ))}
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => openEditDialog(selectedNode)}
            >
              Edit Budget
            </Button>
            <Button
              variant="outlined"
              startIcon={<MoneyIcon />}
              onClick={() => openAllocationDialog(selectedNode)}
            >
              Allocate Funds
            </Button>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => openCreateDialog(selectedNode.id)}
            >
              Add Child Budget
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HierarchyIcon color="primary" />
          <Typography variant="h4">
            Hierarchical Budget Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openCreateDialog()}
        >
          Create Budget
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget Hierarchy
              </Typography>
              {loading ? (
                <LinearProgress />
              ) : (
                <Box sx={{ flexGrow: 1, maxWidth: '100%', overflowY: 'auto', maxHeight: '600px' }}>
                  {budgetHierarchy.map(node => renderTreeNode(node))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {renderBudgetDetails()}
        </Grid>
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create Budget' : 
           dialogMode === 'edit' ? 'Edit Budget' : 'Allocate Budget'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Budget Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Budget Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Budget Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {budgetTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Budget"
                type="number"
                value={formData.totalBudget}
                onChange={(e) => setFormData({ ...formData, totalBudget: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={formData.timeframe}
                  label="Timeframe"
                  onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                >
                  {timeframes.map(timeframe => (
                    <MenuItem key={timeframe.value} value={timeframe.value}>
                      {timeframe.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleFormSubmit} variant="contained">
            {dialogMode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HierarchicalBudgetManager;
