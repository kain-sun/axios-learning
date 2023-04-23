'use strict'

import transformData from './transformData.js'
import isCancel from '../cancel/isCancel.js'
import defaults from '../defaults/index.js'
import CanceledError from '../cancel/CanceledError.js'
import AxiosHeaders from '../core/AxiosHeaders.js'
import adapters from '../adapters/adapters.js'

/**
 * Throws a `CanceledError` if cancellation has been requested.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 */

// 判断如果配置了取消请求的token则就抛出
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    // 调用抛出错误的方法
    config.cancelToken.throwIfRequested()
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError(null, config)
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 *
 * @returns {Promise} The Promise to be fulfilled
 */
// 处理请求头config配置
// 调用adapter适配器发起真正的请求，针对浏览器环境发起ajax请求，node环境发起http请求
// 构造响应数据， 会自动转换 JSON 数据
export default function dispatchRequest(config) {
  // 提前取消请求
  throwIfCancellationRequested(config)

  // 赋个默认值
  config.headers = AxiosHeaders.from(config.headers)

  // Transform request data
  // 转换数据
  config.data = transformData.call(config, config.transformRequest)

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false)
  }

  // 适配器 axios是可以支持node端也支持浏览器端的
  const adapter = adapters.getAdapter(config.adapter || defaults.adapter)

  // 执行请求
  return adapter(config).then(
    function onAdapterResolution(response) {
      // 提前取消请求情况
      throwIfCancellationRequested(config)

      // Transform response data
      // 做数据转换
      response.data = transformData.call(
        config,
        config.transformResponse,
        response
      )

      response.headers = AxiosHeaders.from(response.headers)

      return response
    },
    function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config)

        // Transform response data
        // 做数据转换
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config,
            config.transformResponse,
            reason.response
          )
          reason.response.headers = AxiosHeaders.from(reason.response.headers)
        }
      }

      return Promise.reject(reason)
    }
  )
}
