import {
  BehaviorSubject,
  concat,
  concatMap,
  delay,
  from,
  interval,
  map,
  mergeAll,
  mergeMap,
  of,
  Subject,
  switchMap,
  take,
} from 'rxjs';

test('sync test', () => {
  of(1, 2, 3).subscribe((val) => {
    console.log(`val = ${val}`);
  });
});

test('subject test', () => {
  const s = new Subject<number>();

  s.next(1);
  s.next(2);
  s.next(3);

  s.subscribe((val) => {
    console.log(`val = ${val}`);
  });

  console.log('step 1');
  s.next(1);
  console.log('step 2');
  s.next(2);
  console.log('step 3');
  s.next(3);
});

const logNow = (...args: any[]) => {
  console.log(`[${performance.now().toFixed(2)}]`, ...args);
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

test('pipe subject test', async () => {
  return new Promise<void>(async (resolve) => {
    const s = new Subject<number>();

    s.pipe(delay(10)).subscribe({
      next: (val) => {
        logNow(`val = ${val}`);
      },
      complete: () => {
        resolve();
      },
    });

    logNow();
    s.next(1);
    s.next(2);
    s.next(3);
    s.complete();
  });
});

test('promise test', async () => {
  logNow();
  from(sleep(10)).subscribe(() => {
    logNow();
  });
  await sleep(10);
});

test.only('switchMap test', () => {
  const s = new Subject<{ val: number; delay?: number }>();

  s.pipe(
    switchMap((obj, index) => {
      logNow(obj, index);
      if (obj.delay) {
        return concat(of(`pre ${obj.val}`), from(sleep(obj.delay)).pipe(map(() => obj.val)));
      }
      return of(obj.val);
    }),
  ).subscribe((val) => {
    logNow(`val = ${val}`);
  });

  s.next({ val: 1 });
  s.next({ val: 2, delay: 100 });
  s.next({ val: 3 });
});

test('behavior subject test', () => {
  const s = new BehaviorSubject(1);

  s.subscribe((val) => {
    logNow(`val = ${val}`);
  });
  s.next(1);
  s.next(1);
  s.next(1);
});

test('delay for every event', async () => {
  const s = new Subject<number>();

  s.pipe(
    concatMap((val) => {
      return of(val).pipe(delay(100));
    }),
  ).subscribe((val) => {
    logNow(`val = ${val}`);
  });

  logNow();
  s.next(1);
  s.next(2);
  s.next(3);

  await sleep(300);
});

test('merge test', async () => {
  logNow();
  interval(100)
    .pipe(
      take(3),
      mergeMap((_, i) =>
        interval(100).pipe(
          take(3),
          map((_, j) => `${i}-${j}`),
        ),
      ),
    )
    .subscribe((val) => {
      logNow(`val = ${val}`);
    });

  await sleep(1000);
});
