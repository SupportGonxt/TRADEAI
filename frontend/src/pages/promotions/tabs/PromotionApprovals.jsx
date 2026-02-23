import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const PromotionApprovals = ({ promotionId, promotion, onUpdate }) => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (promotionId) loadApprovals();
  }, [promotionId]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${promotionId}/approvals`);
      setApprovals(response.data.data || []);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    const map = { approved: 'success', rejected: 'error', pending: 'warning', submitted: 'info' };
    return map[status] || 'default';
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Approval History</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Approver</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Comments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {approvals.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No approval records yet</TableCell></TableRow>
            ) : (
              approvals.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.approverName || item.approver?.name || item.approvedBy || 'N/A'}</TableCell>
                  <TableCell>{item.role || item.approverRole || 'N/A'}</TableCell>
                  <TableCell><Chip label={item.status || 'pending'} color={statusColor(item.status)} size="small" /></TableCell>
                  <TableCell>{item.date || item.approvedAt ? new Date(item.date || item.approvedAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{item.comments || item.notes || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PromotionApprovals;
