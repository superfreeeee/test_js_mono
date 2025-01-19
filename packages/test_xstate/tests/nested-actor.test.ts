import { ActorRefFromLogic, assign, createActor, createMachine, spawnChild, toPromise } from 'xstate';
import { User, apiMachineFactory, GetApiMachineType, getUserAPI } from './helpers/api';

test('nested demo', () => {
  const pageMachine = createMachine(
    {
      id: 'Page',
      context: {
        // userInfoActor: undefined as ActorRefFromLogic<GetApiMachineType<typeof getUserAPI>> | undefined,
        userInfo: undefined as User | undefined,
      },
      initial: 'init',
      states: {
        init: {
          entry: ({ context, self }) => {
            console.log('[state:init]', context);
          },
          invoke: {
            src: 'initUser',
            input: [1],
            onDone: {
              target: 'ready',
              actions: [assign({ userInfo: ({ event }) => event.output as User })],
            },
            // [
            //   // () => {},
            //   // assign({
            //   //   userInfo: undefined,
            //   // }),
            // ],
          },
        },
        ready: {
          entry: ({ context }) => {
            console.log('[state:ready]', context);
          },
        },
      },
      // on: {
      //   init: {
      //     actions: ['initUserInfoActor', 'checkReady'],
      //   },
      //   ready: {
      //     actions: ({ self }) => {
      //       console.log('PageReady');
      //       self.send({ type: 'PageReady' });
      //       // const userActor = self.system.get('UserAPI');
      //       // console.log('userActor:', userActor);
      //       // console.log('system.actors:', self.system['actors']);
      //       // console.log('system:', self.system);
      //       // self.send({ type: 'PageReady' });
      //     },
      //   },
      //   checkReady: { actions: ['checkReady'] },
      // },
    },
    {
      actors: {
        initUser: apiMachineFactory(getUserAPI),
      },
      actions: {
        // initUserInfoActor: assign({
        //   userInfoActor: ({ self, spawn }) => {
        //     const userLogic = apiMachineFactory(getUserAPI);
        //     const userActor = spawn(userLogic, {
        //       id: 'UserAPI',
        //       input: [1],
        //     });
        //     toPromise(userActor).then((user) => {
        //       console.log('user:', user);
        //       self.send({ type: 'checkReady' });
        //     });
        //     userActor.start();
        //     return userActor;
        //   },
        // }),
        // checkReady: ({ context, self }) => {
        //   console.log('checkReady');
        //   if (context.userInfoActor?.getSnapshot().status === 'done') {
        //     self.send({ type: 'ready' });
        //   }
        // },
      },
    },
  );

  const pageActor = createActor(pageMachine);
  pageActor.on('PageReady', (event) => {
    console.log('[on:PageReady]', event);
  });

  pageActor.start();

  pageActor.send({ type: 'init' });
  console.log(Reflect.ownKeys(pageActor.system));
  // console.log(pageActor.getSnapshot().children);
  // console.log(pageActor.getSnapshot().children['0.Page.init'].getSnapshot().children);
});
