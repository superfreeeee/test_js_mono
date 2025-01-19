import { assign, createActor, createMachine, fromPromise } from 'xstate';
import { Draft, produce } from 'immer';
import { sleep } from './utils';

enum CounterEvent {
  Increment = 'Counter.Increment',
  Reset = 'Counter.Reset',
}

const incSeq = ({ context }: { context: { seq: number } }) => context.seq + 1;

const counterMachine = createMachine({
  id: 'counter',
  context: {
    seq: 0,
    count: 0,
  },
  on: {
    [CounterEvent.Increment]: {
      actions: assign({
        count: ({ context }) => context.count + 1,
        seq: incSeq,
      }),
    },
    [CounterEvent.Reset]: {
      actions: [
        assign({
          count: 0,
          seq: incSeq,
        }),
      ],
    },
  },
});

const partialSubscriberFactory = <Context, Value>(
  selector: (context: Context) => Value,
  callback: (value: Value) => void,
) => {
  let cur: Value;
  let inner = (context: Context) => {
    // init subscriber
    cur = selector(context);
    callback(cur);

    // rest subscriber
    inner = (context: Context) => {
      const next = selector(context);
      if (next !== cur) {
        cur = next;
        callback(cur);
      }
    };
  };
  const subscriber = (context: Context) => {
    inner(context);
  };
  return subscriber;
};

describe('counter tests', () => {
  test('counter: subscribe', () => {
    const capture: string[] = [];

    const counterActor = createActor(counterMachine);
    counterActor.subscribe((snapshot) => {
      capture.push(`snapshot.context: ${JSON.stringify(snapshot.context)}`);
    });
    counterActor.start();

    counterActor.send({ type: CounterEvent.Increment });
    counterActor.send({ type: CounterEvent.Increment });
    counterActor.send({ type: CounterEvent.Increment });
    counterActor.send({ type: 'unknown' });
    counterActor.send({ type: CounterEvent.Reset });

    expect(capture).toEqual([
      'snapshot.context: {"seq":0,"count":0}',
      'snapshot.context: {"seq":1,"count":1}',
      'snapshot.context: {"seq":2,"count":2}',
      'snapshot.context: {"seq":3,"count":3}',
      'snapshot.context: {"seq":3,"count":3}',
      'snapshot.context: {"seq":4,"count":0}',
    ]);
  });

  test('counter: partial subscribe', () => {
    const captures: string[] = [];

    const counterSubscriber = partialSubscriberFactory(
      (context: { count: number }) => context.count,
      (count) => {
        captures.push(`count = ${count}`);
      },
    );

    const counterActor = createActor(counterMachine, {
      input: 'test',
    });
    counterActor.subscribe((snapshot) => {
      counterSubscriber(snapshot.context);
    });
    counterActor.start();

    counterActor.send({ type: CounterEvent.Increment });
    counterActor.send({ type: CounterEvent.Increment });
    counterActor.send({ type: CounterEvent.Increment });
    counterActor.send({ type: 'unknown' });
    counterActor.send({ type: CounterEvent.Reset });

    expect(captures).toEqual([
      'count = 0', //
      'count = 1',
      'count = 2',
      'count = 3',
      'count = 0',
    ]);
  });
});

const apiMachine = createMachine({
  id: 'no-param-api',
  context: ({
    input,
  }): {
    input;
    loading: boolean;
    data: number[] | undefined;
    error: Error | undefined;
  } => {
    return {
      input,
      loading: false,
      data: undefined,
      error: undefined,
    };
  },
  invoke: {
    src: fromPromise<number[], { len: number }>(async ({ input }) => {
      await sleep(0);
      return Array.from({ length: input.len }, (_, i) => i);
    }),
    input: ({ context }) => context.input,
    onDone: {
      actions: ({ context, event }) => {
        // console.log('onDone:', { context, event });
        context.loading = false;
        context.data = event.output;
      },
    },
    onError: {
      actions: ({ context, event }) => {
        // console.log('onError:', { context, event });
      },
    },
  },
});

describe('api tests', () => {
  test('no param api', async () => {
    const captures: string[] = [];

    const apiActor = createActor(apiMachine, {
      id: 'apiMachine',
      input: { len: 5 },
    });
    apiActor.subscribe((snapshot) => {
      captures.push(JSON.stringify(snapshot.context));
    });
    apiActor.start();

    await sleep(10);
    expect(captures).toEqual([
      '{"input":{"len":5},"loading":false}',
      '{"input":{"len":5},"loading":false,"data":[0,1,2,3,4]}',
    ]);
  });
});

enum BizApiState {
  Idle = 'Idle',
  Loading = 'Loading',
  Success = 'Success',
  Error = 'Error',
}

enum BizApiEvent {
  Fetch = 'Fetch',
}

const createBizApiActor = <Fetcher extends (...params: any[]) => Promise<any>>(fetcher: Fetcher) => {
  type Params = Parameters<Fetcher>;
  type Result = Awaited<ReturnType<Fetcher>>;

  const machine = createMachine({
    id: 'BizApi',
    context: {
      lastId: 0,
      loading: false,
      data: undefined,
    },
    initial: BizApiState.Idle,
    states: {
      [BizApiState.Idle]: {
        on: {
          [BizApiEvent.Fetch]: {
            target: BizApiState.Loading,
            actions: [
              assign({
                loading: true,
                data: undefined,
              }),
              ({ context, event }) => {
                event.reqId = ++context.lastId;
                console.log('reqId', event.reqId);
              },
            ],
          },
        },
      },
      [BizApiState.Loading]: {
        invoke: {
          src: fromPromise(async ({ input }) => {
            console.log('fetch', { input });
            const data = await fetcher(...(input.params as Params));
            return { reqId: input.reqId, data };
          }),
          input: ({ event }) => ({
            params: event.payload as Params,
            reqId: event.reqId,
          }),
          onDone: {
            actions: [
              assign({ loading: false }),
              ({ context, event }) => {
                const { reqId, data } = event.output;
                console.log('onDone', event.output);
                if (context.lastId !== reqId) {
                  return;
                }
                context.data = data;
              },
            ],
          },
        },
        on: {
          [BizApiEvent.Fetch]: {
            target: BizApiState.Loading,
            actions: ({ context, event }) => {
              event.reqId = ++context.lastId;
              console.log('reqId', event.reqId);
            },
          },
        },
      },
    },
  });

  const actor = createActor(machine);
  actor.start();

  return {
    fetch: (...params: Params) => actor.send({ type: BizApiEvent.Fetch, payload: params }),
    subscribe: (subscriber: (state: { loading: boolean; data?: Result }) => void) => {
      const observer = partialSubscriberFactory((context) => context, subscriber);
      const subscription = actor.subscribe((snapshot) => {
        observer(snapshot.context);
      });

      return () => subscription.unsubscribe();
    },
  };
};

test.only('BizApiActor', async () => {
  const actor = createBizApiActor(async (id: number) => {
    return `id: ${id}`;
  });

  actor.subscribe((state) => {
    console.log('state', { state });
  });

  actor.fetch(1);
  actor.fetch(1);
  actor.fetch(1);
  actor.fetch(1);

  await sleep(10);
});
