import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  LinearProgress,
  Grid
} from '@mui/material';
import { Add as AddIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import kamWalletService from '../../services/kamwallet/kamWalletService';
import customerService from '../../services/customer/customerService';
import { useCurrency } from '../../contexts/CurrencyContext';

const KAMWalletAllocate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { formatCurrency } = useCurrency();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    loadWallet();
    loadCustomers();
  }, [id]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const data = await kamWalletService.getWallet(id);
      setWallet(data);
      setError(null);
    } catch (err) {
      setError('Failed to load wallet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const handleAllocate = async () => {
    try {
      await kamWalletService.allocateToCustomer(
        id,
        formData.customerId,
        parseFloat(formData.amount),
        formData.notes
      );
      setOpenDialog(false);
      setFormData({ customerId: '', amount: '', notes: '' });
      setSuccess('Allocation created successfully');
      loadWallet();
    } catch (err) {
      setError('Failed to allocate funds: ' + err.message);
    }
  };

  const calculateTotals = () => {
    if (!wallet) return { totalAllocated: 0, totalUsed: 0, remaining: 0 };
    
    const totalAllocated = wallet.allocations?.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0) || 0;
    const totalUsed = wallet.allocations?.reduce((sum, alloc) => sum + alloc.usedAmount, 0) || 0;
    const remaining = wallet.totalAllocation - totalAllocated;
    
    return { totalAllocated, totalUsed, remaining };
  };

  const { totalAllocated, totalUsed, remaining } = calculateTotals();
  const usedPercentage = wallet ? ((totalUsed / wallet.totalAllocation) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading wallet...</Typography>
      </Box>
    );
  }

  if (!wallet) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Wallet not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/kamwallet')}
          >
            Back
          </Button>
          <Typography variant="h4">Allocate Wallet Funds</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={remaining <= 0}
        >
          New Allocation
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Allocation
              </Typography>
              <Typography variant="h5">
                {formatCurrency(wallet.totalAllocation)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Allocated to Customers
              </Typography>
              <Typography variant="h5">
                {formatCurrency(totalAllocated)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Actually Used
              </Typography>
              <Typography variant="h5">
                {formatCurrency(totalUsed)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(usedPercentage, 100)}
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="textSecondary">
                {usedPercentage}% used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Remaining to Allocate
              </Typography>
              <Typography variant="h5" color={remaining > 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(remaining)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Customer Allocations
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Allocated Amount</TableCell>
                  <TableCell align="right">Used Amount</TableCell>
                  <TableCell align="right">Remaining</TableCell>
                  <TableCell>Allocated Date</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {wallet.allocations && wallet.allocations.length > 0 ? (
                  (wallet?.allocations || []).map((allocation, index) => {
                    const allocationRemaining = allocation.allocatedAmount - allocation.usedAmount;
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {allocation.customerId?.name || allocation.customerId?.code || 'Unknown Customer'}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(allocation.allocatedAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(allocation.usedAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(allocationRemaining)}
                        </TableCell>
                        <TableCell>
                          {new Date(allocation.allocatedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{allocation.notes || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No allocations yet. Click "New Allocation" to allocate funds to customers.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Allocate Funds to Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Alert severity="info">
              Available to allocate: {formatCurrency(remaining)}
            </Alert>

            <TextField
              select
              label="Customer"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              fullWidth
              required
            >
              {customers.map((customer) => (
                <MenuItem key={customer.id || customer._id} value={customer.id || customer._id}>
                  {customer.name} ({customer.code})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              required
              helperText={`Maximum: ${formatCurrency(remaining)}`}
              error={parseFloat(formData.amount) > remaining}
            />

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAllocate}
            variant="contained"
            disabled={
              !formData.customerId ||
              !formData.amount ||
              parseFloat(formData.amount) <= 0 ||
              parseFloat(formData.amount) > remaining
            }
          >
            Allocate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KAMWalletAllocate;
