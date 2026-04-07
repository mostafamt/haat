export const PHONE_REGEX = /^01[0-9]{9}$/;
export const isValidPhone = (v) => PHONE_REGEX.test(v.trim());
export const isPositiveNumber = (v) => !isNaN(Number(v)) && Number(v) > 0;
