import { assign, createMachine } from 'xstate';

export enum CounterEvent {
  Inc = 'CounterInc',
  Reset = 'CounterReset',
}

export const counterMachine = createMachine({
  id: 'counter',
  context: {
    seq: 0,
    count: 0,
  },
  on: {
    [CounterEvent.Inc]: {
      actions: assign({
        seq: ({ context }) => context.seq + 1,
        count: ({ context }) => context.count + 1,
      }),
    },
    [CounterEvent.Reset]: {
      actions: assign({
        seq: ({ context }) => context.seq + 1,
        count: 0,
      }),
    },
  },
});
