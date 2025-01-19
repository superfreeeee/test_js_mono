import { createActor, fromPromise, toPromise } from 'xstate';
import { sleep } from './utils';
import { getUserAPI, User } from './helpers/api';

test('promise test', async () => {
  const machine = fromPromise<User, { id: number }>(async ({ input }) => {
    return getUserAPI(input.id);
  });

  // using actor
  const runActor1 = async () => {
    const actor = createActor(machine, { input: { id: 1 } });
    actor.subscribe((snapshot) => {
      if (snapshot.status === 'done') {
        console.log('user:', snapshot.output);
      }
    });
    actor.start();

    await sleep(0);
  };
  await runActor1();

  // using toPromise
  const runActor2 = async () => {
    const actor = createActor(machine, { input: { id: 2 } });
    actor.start();
    const user = await toPromise(actor);
    console.log('user:', user);
  };
  await runActor2();
});
