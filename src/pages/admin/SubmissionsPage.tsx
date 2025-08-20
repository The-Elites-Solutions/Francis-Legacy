import React from 'react';
import ModerationQueue from '@/components/admin/ModerationQueue';

const SubmissionsPage: React.FC = () => {
  const handleSubmissionReviewed = () => {
    // Trigger a refresh of dashboard stats
    // This will be picked up by the AdminDashboard's polling interval
    window.dispatchEvent(new CustomEvent('submissionReviewed'));
  };

  return (
    <div className="space-y-6">
      <ModerationQueue onSubmissionReviewed={handleSubmissionReviewed} />
    </div>
  );
};

export default SubmissionsPage;