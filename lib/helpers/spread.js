'use strict'

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 *
 * @returns {Function}
 */

// 接受一个函数callback
export default function spread(callback) {
  // 返回一个新函数 arr其实就是成功返回的数组
  return function wrap(arr) {
    // 把并发请求的返回结果给callback 方便把并发请求返回的数据放在一起做处理像上面例子那样
    return callback.apply(null, arr)
  }
}
