import React from 'react';

interface StatusBadgeProps {
  status: 'healthy' | 'needs_trimming' | 'critical';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    healthy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    needs_trimming: 'bg-amber-100 text-amber-700 border-amber-200',
    critical: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  const labels = {
    healthy: 'Healthy',
    needs_trimming: 'Needs Trimming',
    critical: 'Urgent Attention',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
