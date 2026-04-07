export const formatDateTime = (ts) =>
  ts ? new Date(ts.toDate()).toLocaleString('ar-EG') : '';

export const formatDate = (ts) =>
  ts ? new Date(ts.toDate()).toLocaleDateString('ar-EG') : '';
