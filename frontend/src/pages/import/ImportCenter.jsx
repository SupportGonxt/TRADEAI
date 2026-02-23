import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

const ImportCenter = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const steps = ['Select Entity', 'Upload File', 'Validate', 'Import'];

  const entities = [
    {
      id: 'customers',
      name: 'Customers',
      description: 'Customer master data (SAP KNA1/KNVV)',
      template: '/sap-templates/csv/customers.csv',
      icon: '👥',
      fields: ['kunnr', 'name', 'group', 'channel', 'region', 'currency'],
    },
    {
      id: 'products',
      name: 'Products',
      description: 'Material master data (SAP MARA/MARC)',
      template: '/sap-templates/csv/products.csv',
      icon: '📦',
      fields: ['matnr', 'sku', 'name', 'brand', 'category', 'currency'],
    },
    {
      id: 'sales_actuals',
      name: 'Sales Actuals',
      description: 'Billing documents (SAP VBRK/VBRP)',
      template: '/sap-templates/csv/sales_actuals.csv',
      icon: '💰',
      fields: ['billing_doc', 'bill_date', 'kunnr', 'matnr', 'qty', 'net_value'],
    },
    {
      id: 'deductions',
      name: 'Deductions',
      description: 'AR deductions (SAP FI-AR)',
      template: '/sap-templates/csv/deductions.csv',
      icon: '📉',
      fields: ['ar_doc_no', 'posting_date', 'kunnr', 'amount', 'reason_code'],
    },
    {
      id: 'trading_terms',
      name: 'Trading Terms',
      description: 'Trading term agreements',
      template: '/sap-templates/csv/trading_terms.csv',
      icon: '📋',
      fields: ['term_code', 'kunnr', 'start_date', 'end_date', 'rate'],
    },
    {
      id: 'promotions',
      name: 'Promotions',
      description: 'Planned promotions',
      template: '/sap-templates/csv/promotions.csv',
      icon: '🎯',
      fields: ['promo_code', 'name', 'kunnr', 'start_date', 'end_date', 'committed_amount'],
    },
  ];

  const handleEntitySelect = (entity) => {
    setSelectedEntity(entity);
    setActiveStep(1);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const missingFields = selectedEntity.fields.filter(f => !headers.includes(f));
      const extraFields = headers.filter(h => !selectedEntity.fields.includes(h) && h !== '');
      
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        return row;
      }).filter(row => Object.keys(row).length > 0);

      setPreviewData(preview);
      
      setValidationResults({
        totalRows: lines.length - 1,
        validRows: lines.length - 1 - missingFields.length,
        errors: missingFields.length > 0 ? [`Missing required fields: ${missingFields.join(', ')}`] : [],
        warnings: extraFields.length > 0 ? [`Extra fields will be ignored: ${extraFields.join(', ')}`] : [],
      });
      
      setActiveStep(2);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setActiveStep(3);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('entity', selectedEntity.id);

      const response = await apiClient.post('/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResults({
        success: true,
        created: response.data.created || 0,
        updated: response.data.updated || 0,
        failed: response.data.failed || 0,
        message: response.data.message,
      });
    } catch (error) {
      setImportResults({
        success: false,
        message: error.response?.data?.message || 'Import failed',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedEntity(null);
    setUploadedFile(null);
    setValidationResults(null);
    setImportResults(null);
    setPreviewData([]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        📥 Import Center
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Import SAP data using CSV templates. All imports are idempotent and multi-tenant safe.
          Download templates below to get started.
        </Typography>
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Entity Type
              </Typography>
              <Grid container spacing={2}>
                {entities.map((entity) => (
                  <Grid item xs={12} md={6} lg={4} key={entity.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleEntitySelect(entity)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h3" sx={{ mr: 2 }}>
                            {entity.icon}
                          </Typography>
                          <Box>
                            <Typography variant="h6">{entity.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {entity.description}
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          href={entity.template}
                          download
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download Template
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {activeStep === 1 && selectedEntity && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Upload {selectedEntity.name} File
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Upload a CSV file matching the template format. Required fields: {selectedEntity.fields.join(', ')}
                </Typography>
              </Alert>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
                size="large"
              >
                Choose File
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </Button>
              {uploadedFile && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected: {uploadedFile.name}
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <Button onClick={() => setActiveStep(0)}>Back</Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && validationResults && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Validation Results
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="primary">
                        {validationResults.totalRows}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Rows
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="success.main">
                        {validationResults.validRows}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Valid Rows
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" color="error.main">
                        {validationResults.errors.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Errors
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {validationResults.errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {(validationResults?.errors || []).map((error, index) => (
                    <Typography key={index} variant="body2">
                      {error}
                    </Typography>
                  ))}
                </Alert>
              )}

              {validationResults.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {(validationResults?.warnings || []).map((warning, index) => (
                    <Typography key={index} variant="body2">
                      {warning}
                    </Typography>
                  ))}
                </Alert>
              )}

              {previewData.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    startIcon={<PreviewIcon />}
                    onClick={() => setPreviewOpen(true)}
                  >
                    Preview Data
                  </Button>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={() => setActiveStep(1)}>Back</Button>
                <Button
                  variant="contained"
                  onClick={handleImport}
                  disabled={validationResults.errors.length > 0}
                >
                  Import Data
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Import Progress
              </Typography>
              
              {importing && (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Importing {selectedEntity.name}...
                  </Typography>
                </Box>
              )}

              {importResults && (
                <Box>
                  {importResults.success ? (
                    <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
                      <Typography variant="h6">Import Successful!</Typography>
                      <Typography variant="body2">
                        Created: {importResults.created} | Updated: {importResults.updated} | Failed: {importResults.failed}
                      </Typography>
                      {importResults.message && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {importResults.message}
                        </Typography>
                      )}
                    </Alert>
                  ) : (
                    <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                      <Typography variant="h6">Import Failed</Typography>
                      <Typography variant="body2">
                        {importResults.message}
                      </Typography>
                    </Alert>
                  )}

                  <Button variant="contained" onClick={handleReset}>
                    Import Another File
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Data Preview (First 5 Rows)</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {previewData.length > 0 && Object.keys(previewData[0]).map((key) => (
                    <TableCell key={key}><strong>{key}</strong></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    {Object.values(row).map((value, i) => (
                      <TableCell key={i}>{value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImportCenter;
