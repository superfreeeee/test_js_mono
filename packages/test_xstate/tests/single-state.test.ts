import { createActor, createMachine } from 'xstate';
import { commonLog } from './utils';

test('single state', () => {
  const actor = createActor(
    createMachine({
      id: 'single',
      initial: 'default',
      states: {
        default: {
          entry: () => {
            commonLog('entry');
          },
          exit: () => {
            commonLog('exit');
          },
        },
      },
    }),
  ).start();

  actor.stop();
});
