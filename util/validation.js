function isValidText(value, minLength = 2, maxLength = 30) {
  return (
    value &&
    value.trim().length >= minLength &&
    value.trim().length <= maxLength &&
    /^[a-zA-Z\s]+$/.test(value)
  );
}

function isValidNumber(value, minValue = 100, maxValue = 100000000) {
  return (
    value &&
    Math.abs(value) % 100 === 0 &&
    Math.abs(value) >= minValue &&
    Math.abs(value) <= maxValue
  );
}

function isValidUsername(value, minLength = 6, maxLength = 16) {
  return (
    value &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /^[a-zA-Z0-9]*$/.test(value) &&
    value.trim().length >= minLength &&
    value.trim().length <= maxLength
  );
}

function isValidPassword(value, minLength = 8, maxLength = 16) {
  return (
    value &&
    value.trim().length >= minLength &&
    value.trim().length <= maxLength &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[$&+,:;=?@#|'"<>.⌃*()%!-_]/.test(value)
  );
}

exports.isValidText = isValidText;
exports.isValidNumber = isValidNumber;
exports.isValidUsername = isValidUsername;
exports.isValidPassword = isValidPassword;
