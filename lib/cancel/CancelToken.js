'use strict'

import CanceledError from './CanceledError.js'

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @param {Function} executor The executor function.
 *
 * @returns {CancelToken}
 */
class CancelToken {
  constructor(executor) {
    // 类型判断
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.')
    }

    // 创建一个promise的实例
    let resolvePromise

    this.promise = new Promise(function promiseExecutor(resolve) {
      // 把resolve方法提出来 当resolvePromise执行时，this.promise状态会变为fulfilled
      resolvePromise = resolve
    })

    // 存一下this
    const token = this

    // eslint-disable-next-line func-names
    this.promise.then((cancel) => {
      if (!token._listeners) return

      let i = token._listeners.length

      while (i-- > 0) {
        token._listeners[i](cancel)
      }
      token._listeners = null
    })

    // eslint-disable-next-line func-names
    this.promise.then = (onfulfilled) => {
      let _resolve
      // eslint-disable-next-line func-names
      const promise = new Promise((resolve) => {
        token.subscribe(resolve)
        _resolve = resolve
      }).then(onfulfilled)

      promise.cancel = function reject() {
        token.unsubscribe(_resolve)
      }

      return promise
    }

    // new CancelToken时会立即调用executor方法 也就是 会执行source方法中的cancel = c;
    // 这里也就是把cancel函数暴露出去了，把取消的时机留给了使用者 使用者调用cancel时候也就会执行函数内的逻辑
    executor(function cancel(message, config, request) {
      // 请求已经被取消了直接return
      if (token.reason) {
        // Cancellation has already been requested
        return
      }

      // 给token(可就是当前this上)添加参数 调用new Cancel构造出cancel信息实例
      token.reason = new CanceledError(message, config, request)

      // 这里当主动调用cancel方法时，就会把this.promise实例状态改为fulfilled，resolve出的信息则是reason（new Cancel实例）
      resolvePromise(token.reason)
    })
  }

  // 这里简单梳理下，在CancelToken中 会创建一个promise实例，和一个reason存储取消信息，
  // 当使用者调用source.cancel(message)方法时，会将该promise实例状态改为fulfilled，
  // 同时根据参数message创建reason错误信息实例，实例上还有__CANCEL__属性，标识他是取消请求返回的信息。

  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  // CancelToken原型上有个么一个方法 很简单就是直接抛错 将reason抛出
  // reason则是根据调用cancel函数的参数 new Cancel的实例
  throwIfRequested() {
    if (this.reason) {
      throw this.reason
    }
  }

  /**
   * Subscribe to the cancel signal
   */

  subscribe(listener) {
    if (this.reason) {
      listener(this.reason)
      return
    }

    if (this._listeners) {
      this._listeners.push(listener)
    } else {
      this._listeners = [listener]
    }
  }

  /**
   * Unsubscribe from the cancel signal
   */

  unsubscribe(listener) {
    if (!this._listeners) {
      return
    }
    const index = this._listeners.indexOf(listener)
    if (index !== -1) {
      this._listeners.splice(index, 1)
    }
  }

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */

  // 暴露出token 和 cancel取消方法
  static source() {
    let cancel
    // 构造CancelToken 的实例,实例上有两个属性一个promise一个reason
    // 同时把注册的回调函数的参数也是个函数把这个函数的执行权抛使用者调用(cancel)
    const token = new CancelToken(function executor(c) {
      cancel = c
    })
    return {
      token,
      cancel,
    }
  }
}

export default CancelToken
