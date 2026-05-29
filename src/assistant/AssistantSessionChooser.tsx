import React from 'react';
import type { AssistantSession } from './sessionDiscovery.js';

export function AssistantSessionChooser(_props: {
  sessions: AssistantSession[];
  onSelect: (id: string) => void;
  onCancel: () => void;
}) {
  return React.createElement('div', null, 'AssistantSessionChooser (stub)');
}
