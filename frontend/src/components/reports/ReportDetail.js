import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Assessment as ReportIcon,
  DateRange as DateRangeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { reportService } from '../../services/api/reportService';
import ReportForm from './ReportForm';
import { formatLabel } from '../../utils/formatters';

const ReportDetail = ({ open, onClose, reportId, onUpdate, onDelete }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open && reportId) {
      fetchReport();
    }
  }, [open, reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReport(reportId);
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleEditClose = () => {
    setEditMode(false);
  };

  const handleEditSave = (updatedReport) => {
    setReport(updatedReport);
    setEditMode(false);
    if (onUpdate) {
      onUpdate(updatedReport);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await reportService.deleteReport(reportId);
        if (onDelete) {
          onDelete(reportId);
        }
        onClose();
      } catch (error) {
        console.error('Error deleting report:', error);
      }
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      // This would call the appropriate report generation endpoint based on report type
      const response = await reportService.generateReport(report.reportType, {
        reportId: reportId,
        ...report.configuration
      });
      
      // Handle the generated report (download, display, etc.)
      console.log('Report generated:', response);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const getReportTypeLabel = (type) => {
    const types = {
      'promotion_effectiveness': 'Promotion Effectiveness',
      'budget_utilization': 'Budget Utilization',
      'customer_performance': 'Customer Performance',
      'product_performance': 'Product Performance',
      'trade_spend_analysis': 'Trade Spend Analysis',
      'roi_analysis': 'ROI Analysis',
      'custom': 'Custom Report'
    };
    return types[type] || type;
  };

  const getFrequencyLabel = (frequency) => {
    const frequencies = {
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly'
    };
    return frequencies[frequency] || frequency;
  };

  if (editMode) {
    return (
      <ReportForm
        open={editMode}
        onClose={handleEditClose}
        report={report}
        onSave={handleEditSave}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            Report Details
          </Typography>
          <Box>
            <Tooltip title="Generate Report">
              <IconButton onClick={handleGenerateReport} size="small" disabled={generating}>
                <RunIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Report">
              <IconButton onClick={handleEdit} size="small">
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Report">
              <IconButton onClick={handleDelete} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : report ? (
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <ReportIcon fontSize="large" color="primary" />
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {report.name}
                  </Typography>
                  {report.description && (
                    <Typography variant="body2" color="text.secondary">
                      {report.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* Status and Type */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Report Information
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Typography variant="subtitle2">Status:</Typography>
                    <Chip
                      label={report.status || 'Draft'}
                      color={getStatusColor(report.status)}
                      size="small"
                    />
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Typography variant="subtitle2">Type:</Typography>
                    <Typography variant="body2">
                      {getReportTypeLabel(report.reportType)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">Visibility:</Typography>
                    {report.isPublic ? (
                      <Chip icon={<PublicIcon />} label="Public" size="small" color="info" />
                    ) : (
                      <Chip icon={<PrivateIcon />} label="Private" size="small" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Configuration */}
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                    Configuration
                  </Typography>
                  {report.configuration?.dateRange && (
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        <DateRangeIcon fontSize="small" sx={{ mr: 1 }} />
                        Date Range:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.configuration.dateRange.startDate && 
                          format(new Date(report.configuration.dateRange.startDate), 'PPP')
                        } - {report.configuration.dateRange.endDate && 
                          format(new Date(report.configuration.dateRange.endDate), 'PPP')
                        }
                      </Typography>
                    </Box>
                  )}
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">Output Format:</Typography>
                    <Chip 
                      label={formatLabel(report.configuration?.outputFormat) || 'PDF'} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Scheduling */}
            {report.schedule?.enabled && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                      Scheduling
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Typography variant="subtitle2">Frequency:</Typography>
                          <Typography variant="body2">
                            {getFrequencyLabel(report.schedule.frequency)}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">Time:</Typography>
                          <Typography variant="body2">
                            {report.schedule.time}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        {report.schedule.recipients && report.schedule.recipients.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                              Recipients:
                            </Typography>
                            <List dense>
                              {(report?.schedule?.recipients || []).map((recipient, index) => (
                                <ListItem key={index} sx={{ py: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 20 }}>
                                    <EmailIcon fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={recipient} 
                                    primaryTypographyProps={{ variant: 'body2' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Tags */}
            {report.tags && report.tags.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {(report?.tags || []).map((tag, index) => (
                    <Chip key={index} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Metadata */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Report History
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {report.createdAt ? format(new Date(report.createdAt), 'PPpp') : 'Unknown'}
                  {report.createdBy && (
                    <> by {report.createdBy.firstName} {report.createdBy.lastName}</>
                  )}
                </Typography>
                {report.updatedAt && report.updatedAt !== report.createdAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last updated: {format(new Date(report.updatedAt), 'PPpp')}
                    {report.lastModifiedBy && (
                      <> by {report.lastModifiedBy.firstName} {report.lastModifiedBy.lastName}</>
                    )}
                  </Typography>
                )}
                {report.lastGenerated && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last generated: {format(new Date(report.lastGenerated), 'PPpp')}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Typography>Report not found</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {report && (
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            startIcon={generating ? null : <RunIcon />}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReportDetail;
