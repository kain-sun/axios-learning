'use strict'

import utils from './utils.js'
import bind from './helpers/bind.js'
import Axios from './core/Axios.js'
import mergeConfig from './core/mergeConfig.js'
import defaults from './defaults/index.js'
import formDataToJSON from './helpers/formDataToJSON.js'
import CanceledError from './cancel/CanceledError.js'
import CancelToken from './cancel/CancelToken.js'
import isCancel from './cancel/isCancel.js'
import { VERSION } from './env/data.js'
import toFormData from './helpers/toFormData.js'
import AxiosError from './core/AxiosError.js'
import spread from './helpers/spread.js'
import isAxiosError from './helpers/isAxiosError.js'
import AxiosHeaders from './core/AxiosHeaders.js'
import HttpStatusCode from './helpers/HttpStatusCode.js'

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 *
 * @returns {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  const context = new Axios(defaultConfig)

  // 创建实例 bind后返回的是一个函数，并且上下文指向context
  const instance = bind(Axios.prototype.request, context)

  // 拷贝prototype到实例上 类似于把Axios的原型上的方法(例如: request、get、post...)继承到实例上，this指向为context
  utils.extend(instance, Axios.prototype, context, { allOwnKeys: true })

  // Copy context to instance
  utils.extend(instance, context, null, { allOwnKeys: true })

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig))
  }

  return instance
}

// Create the default instance to be exported
const axios = createInstance(defaults)

// Expose Axios class to allow class inheritance
axios.Axios = Axios

// Expose Cancel & CancelToken
// 抛出了三个取消请求的相关接口Cancel、CancelToken、isCancel
axios.CanceledError = CanceledError
axios.CancelToken = CancelToken // 提供创建token实例注册取消请求能力及提供取消请求方法
axios.isCancel = isCancel // 用于判断是否为取消请求返回的结果，也就是是否是Cancel实例
axios.VERSION = VERSION
axios.toFormData = toFormData

// Expose AxiosError class
axios.AxiosError = AxiosError

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises)
}

axios.spread = spread

// Expose isAxiosError
axios.isAxiosError = isAxiosError

// Expose mergeConfig
axios.mergeConfig = mergeConfig

axios.AxiosHeaders = AxiosHeaders

axios.formToJSON = (thing) =>
  formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing)

axios.HttpStatusCode = HttpStatusCode

axios.default = axios

// this module should only have a default export
export default axios
