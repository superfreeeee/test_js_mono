import { assign, createMachine, enqueueActions, setup } from 'xstate';

export const timerMachine = setup({
  types: {
    context: {} as {
      innerTimer: number | undefined;
      tick: number;
    },
    events: {} as {
      type: 'start' | 'stop' | 'nextTick';
    },
  },
  actions: {
    nextTick: assign({ tick: ({ context }) => context.tick + 1 }),
    createTimer: enqueueActions(({ enqueue }) => {
      const timer = window.setInterval(() => {
        enqueue.assign({ tick: ({ context }) => context.tick + 1 });
      }, 1000);

      enqueue.assign({
        innerTimer: timer,
      });
    }),
    stopTimer: ({ context }) => {
      window.clearInterval(context.innerTimer);
    },
    clearTimer: assign({ innerTimer: undefined }),
  },
}).createMachine({
  id: 'timer',
  context: {
    innerTimer: 0,
    tick: 0,
  },
  on: {
    nextTick: { actions: 'nextTick' },
    start: {
      actions: [
        enqueueActions(({ enqueue, self }) => {
          const timer = window.setInterval(() => {
            self.send({ type: 'nextTick' });
          }, 100);

          enqueue.assign({
            innerTimer: timer,
          });
        }),
      ],
    },
    stop: {
      actions: [
        ({ context }) => {
          window.clearInterval(context.innerTimer);
        },
        assign({ innerTimer: undefined }),
      ],
    },
  },
});
