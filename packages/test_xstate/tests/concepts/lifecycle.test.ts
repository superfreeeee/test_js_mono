import { ActorRef, AnyActorRef, AnyEventObject, AnyMachineSnapshot, createActor, createMachine } from 'xstate';
import { commonLog, sleep } from '../utils';

test('lifecycle: machine level', async () => {
  const actor = createActor(
    createMachine({
      id: 'non-state-machine',
      entry: () => {
        commonLog('entry');
      },
      exit: () => {
        commonLog('exit');
      },
    }),
  );
  commonLog('start');
  actor.start();

  await sleep(10);

  commonLog('stop');
  actor.stop();

  await sleep(10);
});

test('lifecycle: state level', async () => {
  const logState = (self: ActorRef<AnyMachineSnapshot, AnyEventObject>, timing: `entry ${number}` | `exit ${number}`) =>
    commonLog(`${timing}: state = ${self.getSnapshot().value}`);

  const actor = createActor(
    createMachine({
      id: 'state-machine',
      initial: 'stage-1',
      states: {
        'stage-1': {
          entry: ({ self }) => logState(self, 'entry 1'),
          exit: ({ self }) => logState(self, 'exit 1'),
          on: {
            next: { target: 'stage-2' },
          },
        },
        'stage-2': {
          entry: ({ self }) => {
            logState(self, 'entry 2');
            self.send({ type: 'next' });
          },
          exit: ({ self }) => logState(self, 'exit 2'),
          on: {
            next: { target: 'stage-3' },
          },
        },
        'stage-3': {
          entry: ({ self }) => logState(self, 'entry 3'),
          exit: ({ self }) => logState(self, 'exit 3'),
          on: {
            next: { target: 'stage-1' },
          },
        },
      },
    }),
  );
  commonLog('start');
  actor.start();

  commonLog('next 1');
  actor.send({ type: 'next' });
  // commonLog('next 2');
  // actor.send({ type: 'next' });
  // commonLog('next 3');
  // actor.send({ type: 'next' });

  commonLog('stop');
  actor.stop();

  await sleep(10);
});
