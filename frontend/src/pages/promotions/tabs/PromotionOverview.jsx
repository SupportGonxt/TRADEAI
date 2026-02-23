import React from 'react';
import { Box, Paper, Typography, Grid, Chip } from '@mui/material';
import { formatLabel } from '../../../utils/formatters';

const PromotionOverview = ({ promotion }) => {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Basic Information</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Promotion Type</Typography>
            <Typography variant="body1">{formatLabel(promotion.promotionType)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip label={formatLabel(promotion.status)} size="small" />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">Start Date</Typography>
            <Typography variant="body1">
              {(promotion.startDate || promotion.period?.startDate) ? new Date(promotion.startDate || promotion.period?.startDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">End Date</Typography>
            <Typography variant="body1">
              {(promotion.endDate || promotion.period?.endDate) ? new Date(promotion.endDate || promotion.period?.endDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Financial Summary</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Budget Amount</Typography>
            <Typography variant="h6">
              R {(promotion.budgetAmount || 0).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Expected Lift</Typography>
            <Typography variant="h6">
              {promotion.preEvaluation?.expectedLift?.toFixed(1) || '0'}%
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Expected ROI</Typography>
            <Typography variant="h6" color={(promotion.preEvaluation?.expectedROI || 0) > 0 ? 'success.main' : 'error.main'}>
              {promotion.preEvaluation?.expectedROI?.toFixed(1) || '0'}%
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">Confidence</Typography>
            <Typography variant="h6">
              {promotion.preEvaluation?.confidence ? (promotion.preEvaluation.confidence * 100).toFixed(0) + '%' : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Description</Typography>
        <Typography variant="body1">
          {promotion.description || 'No description available'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default PromotionOverview;
