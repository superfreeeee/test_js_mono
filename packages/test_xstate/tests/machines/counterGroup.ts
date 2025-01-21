import { createMachine, sendTo } from 'xstate';
import { counterMachine } from './counter';

export const counterGroupMachine = createMachine({
  id: 'counter-group',
  invoke: [
    {
      src: counterMachine,
      id: 'counterA',
      systemId: 'sys-counter-1',
    },
    {
      src: counterMachine,
      id: 'counterB',
      systemId: 'sys-counter-2',
    },
  ],
});

// sendTo()
