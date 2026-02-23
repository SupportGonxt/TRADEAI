import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const TradeSpendApprovals = ({ tradeSpendId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tradeSpendId) loadData();
  }, [tradeSpendId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/trade-spends/${tradeSpendId}/approvals`);
      const result = response.data.data || response.data;
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
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
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Comments</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No approval records</TableCell></TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.approverName || item.approvedBy || 'N/A'}</TableCell>
                  <TableCell><Chip label={item.status || 'pending'} size="small" color={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'error' : 'warning'} /></TableCell>
                  <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{item.comments || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TradeSpendApprovals;
