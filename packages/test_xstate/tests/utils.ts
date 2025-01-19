import dayjs from 'dayjs';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const commonLog = (...args: any[]) => {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss:SSS')}]`, ...args);
};

export const testLogger = () => {
  const records: string[] = [];
  const log = (record: string) => records.push(record);
  const reset = () => (records.length = 0);
  return { records, log, reset };
};
