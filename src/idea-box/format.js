export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Tag colour for an application status. */
export const statusTone = (status) =>
  status === 'Approved' ? 'mint' : status === 'Rejected' ? 'red' : status === 'Draft' ? '' : 'amber';
