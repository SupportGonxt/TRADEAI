// Revolutionary Form Validator Hook
// TRADEAI Next-Gen UI - Zero-Slop Compliant

import { useState, useCallback } from 'react';
import { z, ZodSchema } from 'zod';

// Validation rule types
export type ValidationRule = {
  required?: boolean | string;
  minLength?: number | string;
  maxLength?: number | string;
  pattern?: RegExp | string;
  custom?: (value: any) => boolean | string;
};

// Field error type
export type FieldError = {
  field: string;
  message: string;
};

// Form validation state
export type FormValidationState = {
  isValid: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
};

// Use form validator hook
export const useFormValidator = <T extends Record<string, any>>(initialValues: T) => {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validate single field
  const validateField = useCallback((fieldName: string, value: any, rules: ValidationRule) => {
    let errorMessage = '';

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      errorMessage = typeof rules.required === 'string' ? rules.required : `${fieldName} is required`;
    }

    // Min length validation
    if (!errorMessage && rules.minLength && value && value.toString().length < Number(rules.minLength)) {
      errorMessage = typeof rules.minLength === 'string' 
        ? rules.minLength 
        : `${fieldName} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (!errorMessage && rules.maxLength && value && value.toString().length > Number(rules.maxLength)) {
      errorMessage = typeof rules.maxLength === 'string' 
        ? rules.maxLength 
        : `${fieldName} must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (!errorMessage && rules.pattern && value) {
      const pattern = typeof rules.pattern === 'string' 
        ? new RegExp(rules.pattern) 
        : rules.pattern;
      
      if (!pattern.test(value.toString())) {
        errorMessage = `Invalid format for ${fieldName}`;
      }
    }

    // Custom validation
    if (!errorMessage && rules.custom && value) {
      const result = rules.custom(value);
      if (typeof result === 'string') {
        errorMessage = result;
      } else if (result === false) {
        errorMessage = `${fieldName} validation failed`;
      }
    }

    return errorMessage;
  }, []);

  // Validate form with Zod schema
  const validateWithSchema = useCallback(<S extends ZodSchema>(schema: S, data: T) => {
    try {
      schema.parse(data);
      setErrors({});
      setIsValid(true);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        setIsValid(false);
        return { isValid: false, errors: newErrors };
      }
      setErrors({ general: 'Validation failed' });
      setIsValid(false);
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }, []);

  // Validate form with custom rules
  const validateForm = useCallback((fields: Record<string, { value: any; rules: ValidationRule }>) => {
    const newErrors: Record<string, string> = {};
    let formIsValid = true;

    Object.entries(fields).forEach(([fieldName, { value, rules }]) => {
      const errorMessage = validateField(fieldName, value, rules);
      if (errorMessage) {
        newErrors[fieldName] = errorMessage;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(formIsValid);
    return { isValid: formIsValid, errors: newErrors };
  }, [validateField]);

  // Handle field change
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setIsDirty(true);
    
    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
    setIsDirty(false);
    setIsValid(false);
  }, [initialValues]);

  // Get field error
  const getFieldError = useCallback((fieldName: string) => {
    return errors[fieldName] || '';
  }, [errors]);

  return {
    formData,
    errors,
    isValid,
    isDirty,
    handleFieldChange,
    validateField,
    validateForm,
    validateWithSchema,
    getFieldError,
    resetForm,
    setFormData
  };
};

export default useFormValidator;