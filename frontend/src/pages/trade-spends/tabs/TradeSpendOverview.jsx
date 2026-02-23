import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { formatLabel } from '../../../utils/formatters';

const TradeSpendOverview = ({ tradeSpend }) => {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Trade Spend Information</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Spend Type</Typography>
            <Typography variant="body1">{formatLabel(tradeSpend.spendType)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Activity Type</Typography>
            <Typography variant="body1">{tradeSpend.activityType || tradeSpend.category || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Customer</Typography>
            <Typography variant="body1">{tradeSpend.customerName || tradeSpend.customer?.name || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Vendor</Typography>
            <Typography variant="body1">{tradeSpend.vendorName || tradeSpend.vendor?.name || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Financial Summary</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Requested</Typography>
            <Typography variant="h6">R {(typeof tradeSpend.amount === 'number' ? tradeSpend.amount : (tradeSpend.amount?.requested || 0)).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Approved</Typography>
            <Typography variant="h6">R {(tradeSpend.approvedAmount || tradeSpend.amount?.approved || 0).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Spent</Typography>
            <Typography variant="h6">R {(tradeSpend.spentAmount || tradeSpend.amount?.spent || 0).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Remaining</Typography>
            <Typography variant="h6">
              R {((typeof tradeSpend.amount === 'number' ? tradeSpend.amount : (tradeSpend.amount?.approved || 0)) - (tradeSpend.spentAmount || tradeSpend.amount?.spent || 0)).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TradeSpendOverview;
