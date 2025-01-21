import { createActor } from 'xstate';
import { timerMachine } from './machines/timer';
import { sleep } from './utils';

test('test enqueue', async () => {
  const timerActor = createActor(timerMachine);
  timerActor.subscribe((state) => {
    console.log(`tick = ${state.context.tick}`);
  });

  timerActor.start();

  timerActor.send({ type: 'start' });
  await sleep(1_000);
  timerActor.send({ type: 'stop' });
});
