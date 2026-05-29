import React from 'react';

export function SnapshotUpdateDialog(_props: {
  agentType: string;
  scope: unknown;
  snapshotTimestamp: string;
  onComplete: (value: 'merge' | 'keep' | 'replace') => void;
  onCancel: () => void;
}) {
  return React.createElement('div', null, 'SnapshotUpdateDialog (stub)');
}
