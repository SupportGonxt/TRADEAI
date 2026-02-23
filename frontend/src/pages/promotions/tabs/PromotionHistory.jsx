import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../../../services/api/apiClient';

const PromotionHistory = ({ promotionId, promotion }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (promotionId) loadHistory();
  }, [promotionId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/promotions/${promotionId}/history`);
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Change History</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">No history records yet</TableCell></TableRow>
            ) : (
              history.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell>{item.date || item.timestamp ? new Date(item.date || item.timestamp).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{item.userName || item.user?.name || item.userId || 'System'}</TableCell>
                  <TableCell><Chip label={item.action || item.type || 'update'} size="small" variant="outlined" /></TableCell>
                  <TableCell>{item.details || item.description || item.changes || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PromotionHistory;
