import React from 'react';
import ModerationQueue from '@/components/admin/ModerationQueue';

const SubmissionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <ModerationQueue />
    </div>
  );
};

export default SubmissionsPage;