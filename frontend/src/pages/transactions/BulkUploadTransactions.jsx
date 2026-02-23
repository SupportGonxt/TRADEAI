import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  List,
  ListItem,
  ListItemText,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import api from '../../services/api';

export default function BulkUploadTransactions() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);


  const [errors, setErrors] = useState([]);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
        setErrors(['Invalid file format. Please upload CSV or Excel file.']);
        return;
      }
      setFile(selectedFile);
      setErrors([]);
      setUploadResult(null);
    }
  };

  const handleDownloadTemplate = async (format = 'xlsx') => {
    try {
      const response = await api.get(`/transactions/template?format=${format}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transaction_template.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
      setErrors(['Failed to download template']);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrors(['Please select a file first']);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/transactions/bulk/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      setUploadResult(response.data.data);
      
      if (response.data.data.failed.length > 0) {
        setErrors(response.data.data.failed.map(f => `Row ${f.row}: ${f.error}`));
      }

      setFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors([error.response?.data?.message || 'Upload failed']);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Bulk Upload Transactions
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload multiple transactions at once using CSV or Excel files
      </Typography>

      {/* Instructions */}
      <Card sx={{ mb: 3, bgcolor: 'info.lighter' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Instructions
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="1. Download the template"
                secondary="Click the button below to download a CSV or Excel template"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="2. Fill in your transaction data"
                secondary="Fill in all required fields: transactionType, customerId, transactionDate, amount"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="3. Upload your file"
                secondary="Select your completed file and click Upload"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="4. Review results"
                secondary="Check the upload results for any errors or warnings"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Template Download */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 1: Download Template
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadTemplate('csv')}
          >
            Download CSV Template
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownloadTemplate('xlsx')}
          >
            Download Excel Template
          </Button>
        </Box>
      </Paper>

      {/* File Upload */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 2: Upload Your File
        </Typography>

        <Box
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: file ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: file ? 'primary.lighter' : 'grey.50',
            mb: 2
          }}
        >
          <input
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadIcon />}
              size="large"
            >
              Select File
            </Button>
          </label>

          {file && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label={file.name}
                onDelete={() => setFile(null)}
                color="primary"
                size="large"
              />
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Supported formats: CSV, XLSX, XLS (Max size: 10MB)
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handleUpload}
          disabled={!file || uploading}
          fullWidth
        >
          {uploading ? 'Uploading...' : 'Upload Transactions'}
        </Button>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              {uploadProgress}% uploaded
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {errors.length} error(s) found:
          </Typography>
          <List dense>
            {errors.slice(0, 10).map((error, index) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemText primary={error} />
              </ListItem>
            ))}
            {errors.length > 10 && (
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary={`... and ${errors.length - 10} more errors`} />
              </ListItem>
            )}
          </List>
        </Alert>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Results
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {uploadResult.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Rows
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" fontWeight="bold">
                    {uploadResult.success.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {uploadResult.failed.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {uploadResult.success.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                <CheckCircleIcon color="success" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Successfully Created Transactions
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>Transaction Number</TableCell>
                      <TableCell>Transaction ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(uploadResult?.success || []).map((item) => (
                      <TableRow key={item.row}>
                        <TableCell>{item.row}</TableCell>
                        <TableCell>{item.transactionNumber}</TableCell>
                        <TableCell>
                          <Chip label={item.id} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {uploadResult.failed.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                <ErrorIcon color="error" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Failed Transactions
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>Error</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(uploadResult?.failed || []).map((item) => (
                      <TableRow key={item.row}>
                        <TableCell>{item.row}</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error.main">
                            {item.error}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      )}

      {/* Tips */}
      <Card sx={{ mt: 3, bgcolor: 'warning.lighter' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💡 Tips for Successful Upload
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Use valid Customer IDs"
                secondary="Make sure customer IDs exist in the system"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Date format"
                secondary="Use YYYY-MM-DD format for dates (e.g., 2024-11-04)"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Transaction types"
                secondary="Valid types: order, trade_deal, settlement, payment, accrual, deduction"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Maximum rows"
                secondary="You can upload up to 1000 transactions at once"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
