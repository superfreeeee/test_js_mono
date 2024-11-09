import * as fs from 'fs';

console.log('hello');

const stream = fs.createWriteStream('output.log', { flags: 'a' });

process.stdout.write = stream.write.bind(stream);
// process.stdout = stream;

namespace global {
  interface Date {
    format(): string;
  }
}

Date.prototype.format = function (this: Date, format) {
  const date = this;
  const map = {
    YYYY: date.getFullYear(), // 四位數年份
    YY: String(date.getFullYear()).substring(2), // 四位數年份
    MM: String(date.getMonth() + 1).padStart(2, '0'), // 月份（補零）
    DD: String(date.getDate()).padStart(2, '0'), // 日期（補零）
    hh: String(date.getHours()).padStart(2, '0'), // 小時（補零）
    mm: String(date.getMinutes()).padStart(2, '0'), // 分鐘（補零）
    ss: String(date.getSeconds()).padStart(2, '0'), // 秒（補零）
  };

  return format.replace(/YYYY|YY|MM|DD|hh|mm|ss/g, (match) => map[match]);
};

const log = (...args) => {
  const now = new Date().format('YY-MM-DD hh:mm:ss');
  console.log(`[${now}]`, ...args);
};

log('>>> start');
log('test 1');
log('test 2');
log('test 3');
