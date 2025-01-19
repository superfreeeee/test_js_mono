import { createActor, createMachine, fromPromise } from 'xstate';

test('test common event', () => {
  const machine = createMachine({
    id: 'logger',
    initial: '1',
    context: {
      sessionId: 1,
    },
    states: {
      '1': {
        on: {
          next: {
            target: '2',
            actions: ({ self, event }) => {
              console.log(`[1.next] state=${self.getSnapshot().value}, event=${event.type}`);
            },
          },
          log: {
            actions: ({ self, event }) => {
              console.log(`[1.log] state=${self.getSnapshot().value}, event=${event.type}`);
            },
          },
        },
      },
      '2': {
        on: {
          next: {
            target: '3',
            actions: ({ self, event }) => {
              console.log(`[2.next] state=${self.getSnapshot().value}, event=${event.type}`);
            },
          },
        },
      },
      '3': {
        on: {
          next: {
            target: '1',
            actions: ({ self, event }) => {
              console.log(`[3.next] state=${self.getSnapshot().value}, event=${event.type}`);
            },
          },
        },
      },
    },
    on: {
      next: {
        actions: ({ self, event }) => {
          console.log(`state=${self.getSnapshot().value}, event=${event.type}`);
        },
      },
      log: {
        actions: ({ self, event }) => {
          console.log(`[log] state=${self.getSnapshot().value}, event=${event.type}`);
        },
      },
    },
  });

  // machine.provide()

  const actor = createActor(machine);
  actor.start();

  actor.getSnapshot().context.sessionId;

  // state: 1
  actor.send({ type: 'log' });
  actor.send({ type: 'next' });

  // state: 2
  actor.send({ type: 'log' });
  actor.send({ type: 'next' });

  // state: 3
  actor.send({ type: 'log' });
  actor.send({ type: 'next' });
});
