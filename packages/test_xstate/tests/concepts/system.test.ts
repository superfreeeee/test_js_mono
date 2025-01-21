import { AnyActor, createActor, createMachine, setup } from 'xstate';
import { counterMachine } from '../machines/counter';

test('system: access root', () => {
  type RootLogic = typeof rootMachine;

  // setup({
  //   types: {
  //     children: {},
  //   },
  // });
  const rootMachine = createMachine({
    id: 'myRoot',
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
    entry: ({ system }) => {
      const rootActor = system.get('myRoot') as AnyActor;
      console.log('rootActor.id:', rootActor.id);
      console.log('sessionId:', rootActor.sessionId);
      console.log('config.id:', (rootActor.logic as RootLogic).config.id);

      const counterActorA = system.get('sys-counter-1') as AnyActor;
      console.log('counterActorA.id:', counterActorA.id);
      const counterActorB = system.get('sys-counter-2') as AnyActor;
      console.log('counterActorB.id:', counterActorB.id);
    },
  });

  const rootActor = createActor(rootMachine, {
    id: 'myRoot-1',
    systemId: 'myRoot',
  }).start();

  console.log('children keys:', Object.keys(rootActor.getSnapshot().children));
  console.log('children.counterA.id:', rootActor.getSnapshot().children.counterA.id);
});
