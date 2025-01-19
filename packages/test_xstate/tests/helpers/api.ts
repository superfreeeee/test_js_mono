import { EventObject, fromPromise, PromiseActorLogic } from 'xstate';

export type User = {
  id: number;
  name: string;
};

export const getUserAPI = async (id: number) => {
  console.log(`[getUserAPI] id=${id}`);
  return { id, name: `user-${id}` };
};

export const doubleAPI = async (num: number) => num * 2;

// fetcher => machine (by fromPromise)
export const apiMachineFactory = <F extends (...params: any[]) => Promise<any>>(fetcher: F) => {
  type Params = Parameters<F>;
  type Result = Awaited<ReturnType<F>>;
  return fromPromise<Result, Params>(async ({ input }) => fetcher(...input));
};

export type GetApiMachineType<F extends (...params: any[]) => Promise<any>> = PromiseActorLogic<
  Awaited<ReturnType<F>>,
  Parameters<F>,
  EventObject
>;
