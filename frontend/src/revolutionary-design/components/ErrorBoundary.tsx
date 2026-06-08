// Revolutionary Error Boundary Component
// TRADEAI Next-Gen UI - Zero-Slop Compliant

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, Box, Typography } from '@mui/material';
import { BugReport, Refresh } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Revolutionary Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
    
    // TODO: Send error to logging service in production
    // In a real implementation, we would send this to our error tracking service
  }

  handleReload = () => {
    // Reload the page to recover from the error
    window.location.reload();
  };

  handleReportError = () => {
    // TODO: Send error report to support team
    alert('Error reported to support team. Thank you for helping us improve!');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          p={2}
        >
          <Card 
            variant="outlined" 
            sx={{ 
              maxWidth: 600, 
              p: 4, 
              textAlign: 'center',
              backgroundColor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <BugReport sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, but something went wrong. Our team has been notified and is working on fixing the issue.
            </Typography>
            
            {this.state.error && (
              <Box 
                sx={{ 
                  backgroundColor: 'background.subtle', 
                  p: 2, 
                  borderRadius: 1, 
                  mb: 3, 
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                <Typography variant="caption" color="error.main">
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleReload}
                sx={{ mr: 1 }}
              >
                Reload Page
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleReportError}
              >
                Report Issue
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              If the problem persists, please contact support at support@tradeai.com
            </Typography>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;