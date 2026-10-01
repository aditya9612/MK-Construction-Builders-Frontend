export const z = {
  required(value, message = 'This field is required') {
    if (value == null || String(value).trim() === '') return message;
    return '';
  },
};
