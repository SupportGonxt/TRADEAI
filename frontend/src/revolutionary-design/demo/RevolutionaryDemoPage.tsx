// Revolutionary Demo Page
// TRADEAI Next-Gen UI - Zero-Slop Compliant Implementation

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import {
  Rocket,
  CheckCircle,
  Error,
  Warning,
  Info
} from '@mui/icons-material';
import RevolutionaryDashboard from '../components/RevolutionaryDashboard';
import RevolutionaryDataTable from '../components/RevolutionaryDataTable';
import RevolutionaryForm from '../components/RevolutionaryForm';
import { useNotifications } from '../components/NotificationCenter';
import { useDataFetcher } from '../hooks/useDataFetcher';

// Sample data for demonstration
const sampleUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Manager', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Analyst', status: 'inactive' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Director', status: 'active' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Specialist', status: 'pending' },
];

// Sample form fields
const userFormFields = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text' as const,
    required: true,
    placeholder: 'Enter full name'
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email' as const,
    required: true,
    placeholder: 'Enter email address'
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'admin', label: 'Administrator' },
      { value: 'manager', label: 'Manager' },
      { value: 'analyst', label: 'Analyst' },
      { value: 'director', label: 'Director' },
      { value: 'specialist', label: 'Specialist' }
    ]
  }
];

// Demo Page Component
const RevolutionaryDemoPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const { showNotification, showError, showSuccess, showWarning, showInfo } = useNotifications();
  const { data, loading, error, refresh } = useDataFetcher('/api/users');

  // Handle form submission
  const handleFormSubmit = async (formData: any) => {
    console.log('Form submitted:', formData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  };

  // Dashboard widgets
  const dashboardWidgets = [
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      component: (
        <Box>
          <Typography variant="h6" gutterBottom>Recent Activity</Typography>
          <Typography variant="body2" color="text.secondary">
            Showing latest user activities and system events.
          </Typography>
        </Box>
      ),
      md: 6,
      editable: true
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics',
      component: (
        <Box>
          <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
          <Typography variant="body2" color="text.secondary">
            Key performance indicators and trends.
          </Typography>
        </Box>
      ),
      md: 6,
      editable: true
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      component: (
        <Box>
          <Typography variant="h6" gutterBottom>Quick Actions</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Button variant="outlined" size="small">Create User</Button>
            <Button variant="outlined" size="small">Generate Report</Button>
            <Button variant="outlined" size="small">Run Analysis</Button>
          </Box>
        </Box>
      ),
      md: 12,
      editable: true
    }
  ];

  // Table columns
  const userColumns = [
    { id: 'name', label: 'Name', sortable: true },
    { id: 'email', label: 'Email', sortable: true },
    { id: 'role', label: 'Role', sortable: true },
    { 
      id: 'status', 
      label: 'Status', 
      format: (value: string) => (
        <Chip 
          label={value.charAt(0).toUpperCase() + value.slice(1)} 
          size="small" 
          color={
            value === 'active' ? 'success' : 
            value === 'inactive' ? 'default' : 'warning'
          }
          variant="outlined"
        />
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Rocket sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Revolutionary Design System
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Zero-Slop Compliant Implementation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          This demo showcases the revolutionary components built according to the Zero-Slop principles,
          ensuring zero defects and maximum reliability in every interaction.
        </Typography>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Notification Demo */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notification System Demo
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => showSuccess('Operation completed successfully!', 'Success')}
            >
              Show Success
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Error />}
              onClick={() => showError('An error occurred during processing', 'Error')}
            >
              Show Error
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<Warning />}
              onClick={() => showWarning('This is a warning message', 'Warning')}
            >
              Show Warning
            </Button>
            <Button
              variant="contained"
              color="info"
              startIcon={<Info />}
              onClick={() => showInfo('This is an informational message', 'Info')}
            >
              Show Info
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dashboard Demo */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Revolutionary Dashboard
          </Typography>
          <RevolutionaryDashboard
            title="Executive Dashboard"
            widgets={dashboardWidgets}
            onRefresh={refresh}
            loading={loading}
            error={error || null}
          />
        </CardContent>
      </Card>

      {/* Data Table Demo */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Revolutionary Data Table
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => setFormOpen(true)}
              sx={{ mr: 2 }}
            >
              Add New User
            </Button>
            <Button 
              variant="outlined" 
              onClick={refresh}
            >
              Refresh Data
            </Button>
          </Box>
          <RevolutionaryDataTable
            title="User Management"
            columns={userColumns}
            data={data || sampleUsers}
            loading={loading}
            error={error}
            isEmpty={!data || data.length === 0}
            onRefresh={refresh}
            onRowClick={(row) => showInfo(`Clicked on user: ${row.name}`, 'Row Clicked')}
            pageSizeOptions={[5, 10, 25]}
            enableSearch={true}
            enableFilters={true}
          />
        </CardContent>
      </Card>

      {/* Form Demo */}
      <RevolutionaryForm
        title="Add New User"
        fields={userFormFields}
        initialValues={{}}
        onSubmit={handleFormSubmit}
        onCancel={() => setFormOpen(false)}
        open={formOpen}
        maxWidth="sm"
      />
    </Box>
  );
};

export default RevolutionaryDemoPage;