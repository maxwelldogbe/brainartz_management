// Form validation utilities for employee management

export const validatePhone = (phone) => {
  if (!phone?.trim()) {
    return 'Phone number is required';
  }
  
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Check if it starts with + and has 10-15 digits
  if (!/^\+\d{10,15}$/.test(cleanPhone)) {
    return 'Please provide a valid international phone number (e.g., +233241234567)';
  }
  
  return null;
};

export const validateEmail = (email, required = false) => {
  if (!email?.trim()) {
    return required ? 'Email is required' : null;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please provide a valid email address';
  }
  
  return null;
};

export const validateEmployeeForm = (data, type = 'invite') => {
  const errors = {};
  
  // Phone validation (always required)
  const phoneError = validatePhone(data.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }
  
  // Email validation (optional for invites, required for manual if provided)
  const emailError = validateEmail(data.email, false);
  if (emailError) {
    errors.email = emailError;
  }
  
  // Manual creation specific validation
  if (type === 'manual') {
    if (!data.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!data.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!data.username?.trim()) {
      errors.username = 'Username is required';
    } else if (data.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    // If password is provided, validate it
    if (data.password && data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    return '+' + cleaned;
  }
  
  return cleaned;
};