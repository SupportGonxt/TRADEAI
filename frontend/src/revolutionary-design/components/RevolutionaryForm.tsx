// Revolutionary Form Component
// TRADEAI Next-Gen UI - Zero-Slop Compliant

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import {
  Close,
  Save,
  Clear,
  Check
} from '@mui/icons-material';
import { useFormValidator } from '../hooks/useFormValidator';
import { useDataMutator } from '../hooks/useDataFetcher';
import { useNotifications } from './NotificationCenter';

// Form field types
export type FormFieldType = 
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'datetime';

// Form field definition
export interface FormField<T> {
  name: keyof T;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  validator?: (value: any) => string | null;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

// Form props
interface RevolutionaryFormProps<T> {
  title: string;
  fields: FormField<T>[];
  initialValues?: Partial<T>;
  onSubmit: (data: T) => Promise<any>;
  onCancel: () => void;
  open: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  submitButtonText?: string;
  cancelButtonText?: string;
  showResetButton?: boolean;
}

// Revolutionary Form Component
const RevolutionaryForm = <T extends Record<string, any>>({
  title,
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  open,
  maxWidth = 'sm',
  submitButtonText = 'Save',
  cancelButtonText = 'Cancel',
  showResetButton = true
}: RevolutionaryFormProps<T>) => {
  // Initialize form data with default values
  const initialFormData = fields.reduce((acc, field) => {
    acc[field.name as string] = initialValues[field.name] ?? field.defaultValue ?? '';
    return acc;
  }, {} as Record<string, any>);

  const {
    formData,
    errors,
    isValid,
    isDirty,
    handleFieldChange,
    validateForm,
    resetForm
  } = useFormValidator<Record<string, any>>(initialFormData);

  const { mutate, loading, error, success } = useDataMutator<T>();
  const { showError, showSuccess } = useNotifications();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationFields = fields.reduce((acc, field) => {
      acc[field.name as string] = {
        value: formData[field.name as string],
        rules: {
          required: field.required ? `${field.label} is required` : false
        }
      };
      return acc;
    }, {} as Record<string, { value: any; rules: any }>);

    const validation = validateForm(validationFields);

    if (!validation.isValid) {
      showError('Please fix the highlighted errors before submitting', 'Form Validation Error');
      return;
    }

    // Run custom validators
    let hasCustomErrors = false;
    const customErrors: Record<string, string> = {};

    fields.forEach(field => {
      if (field.validator && formData[field.name as string]) {
        const error = field.validator(formData[field.name as string]);
        if (error) {
          customErrors[field.name as string] = error;
          hasCustomErrors = true;
        }
      }
    });

    if (hasCustomErrors) {
      Object.keys(customErrors).forEach(key => {
        showError(customErrors[key], 'Validation Error');
      });
      return;
    }

    try {
      const result = await onSubmit(formData as T);
      
      if (result) {
        showSuccess(`${title} saved successfully`);
        onCancel(); // Close the form
      }
    } catch (err) {
      console.error('Form submission error:', err);
      showError('Failed to save. Please try again.', 'Submission Error');
    }
  };

  // Handle input change
  const handleInputChange = (name: string, value: any) => {
    handleFieldChange(name, value);
  };

  // Handle reset
  const handleReset = () => {
    resetForm();
  };

  // Render form field based on type
  const renderField = (field: FormField<T>) => {
    const fieldName = field.name as string;
    const value = formData[fieldName];
    const error = errors[fieldName];

    switch (field.type) {
      case 'select':
        return (
          <FormControl 
            fullWidth={field.fullWidth !== false} 
            error={!!error}
            disabled={field.disabled}
            sx={{ mb: 2 }}
          >
            <InputLabel>{field.label}{field.required && ' *'}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              label={`${field.label}${field.required ? ' *' : ''}`}
            >
              {(field.options || []).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
            {field.helperText && !error && (
              <FormHelperText>{field.helperText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            fullWidth={field.fullWidth !== false}
            label={`${field.label}${field.required ? ' *' : ''}`}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={field.placeholder}
            multiline={field.multiline !== false}
            rows={field.rows || 3}
            error={!!error}
            helperText={error || field.helperText}
            disabled={field.disabled}
            sx={{ mb: 2 }}
          />
        );

      default:
        return (
          <TextField
            fullWidth={field.fullWidth !== false}
            label={`${field.label}${field.required ? ' *' : ''}`}
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={field.placeholder}
            error={!!error}
            helperText={error || field.helperText}
            disabled={field.disabled}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: field.startAdornment ? (
                <InputAdornment position="start">{field.startAdornment}</InputAdornment>
              ) : undefined,
              endAdornment: field.endAdornment ? (
                <InputAdornment position="end">{field.endAdornment}</InputAdornment>
              ) : undefined,
            }}
          />
        );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}
      >
        <Typography variant="h6" fontWeight="medium">
          {title}
        </Typography>
        <IconButton onClick={onCancel}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          {fields.map((field) => (
            <Box key={field.name as string}>
              {renderField(field)}
            </Box>
          ))}
          
          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, backgroundColor: 'background.subtle' }}>
        {showResetButton && (
          <Button
            onClick={handleReset}
            startIcon={<Clear />}
            disabled={!isDirty || loading}
          >
            Reset
          </Button>
        )}
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button
          onClick={onCancel}
          disabled={loading}
        >
          {cancelButtonText}
        </Button>
        
        <Button
          type="submit"
          onClick={handleSubmit as any}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          disabled={loading || !isDirty}
        >
          {loading ? 'Saving...' : submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RevolutionaryForm;