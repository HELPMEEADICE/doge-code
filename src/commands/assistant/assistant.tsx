import React from 'react';

export async function computeDefaultInstallDir(): Promise<string> {
  return '';
}

export function NewInstallWizard(_props: {
  defaultDir: string;
  onInstalled: (dir: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  return React.createElement('div', null, 'NewInstallWizard (stub)');
}
