/**
 * Validation utilities dựa trên BE validation rules
 */

// Phone number: 9-11 digits
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return 'Số điện thoại là bắt buộc';
  }
  const phoneRegex = /^[0-9]{9,11}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return 'Số điện thoại phải có 9-11 chữ số';
  }
  return null;
};

// Password: 8-128 characters, must contain lowercase, uppercase, and digit
export const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    return 'Mật khẩu là bắt buộc';
  }
  if (password.length < 8 || password.length > 128) {
    return 'Mật khẩu phải có từ 8 đến 128 ký tự';
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/;
  if (!passwordRegex.test(password)) {
    return 'Mật khẩu phải chứa ít nhất một chữ thường, một chữ hoa và một chữ số';
  }
  return null;
};

// Helper để validate form
export const validateForm = (fields, values) => {
  const errors = {};
  Object.keys(fields).forEach((field) => {
    const validator = fields[field];
    const error = validator(values[field]);
    if (error) {
      errors[field] = error;
    }
  });
  return errors;
};









