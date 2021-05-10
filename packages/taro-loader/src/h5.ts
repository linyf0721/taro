import * as webpack from 'webpack'
import { getOptions, stringifyRequest } from 'loader-utils'
import { AppConfig } from '@tarojs/taro'
import { join, dirname } from 'path'
import { frameworkMeta } from './utils'

function genResource(path: string, pages: Map<string, string>, loaderContext: webpack.loader.LoaderContext) {
  const stringify = (s: string): string => stringifyRequest(loaderContext, s)
  return `
  Object.assign({
      path: '${path}',
      load: function() {
          return import(${stringify(join(loaderContext.context, path))})
      }
  }, require(${stringify(pages.get(path)!)}).default || {}),
`
}

export default function(this: webpack.loader.LoaderContext) {
  const options = getOptions(this)
  const stringify = (s: string): string => stringifyRequest(this, s)
  const {
    importFrameworkStatement,
    frameworkArgs,
    creator,
    importFrameworkName,
    extraImportForWeb,
    execBeforeCreateWebApp
  } = frameworkMeta[options.framework]
  const config: AppConfig = options.config
  const pages: Map<string, string> = options.pages
  let tabBarCode = `var tabbarIconPath = []
var tabbarSelectedIconPath = []
`
  if (config.tabBar) {
    const tabbarList = config.tabBar.list
    for (let i = 0; i < tabbarList.length; i++) {
      const t = tabbarList[i]
      if (t.iconPath) {
        const iconPath = stringify(join(dirname(this.resourcePath), t.iconPath))
        tabBarCode += `tabbarIconPath[${i}] = typeof require(${iconPath}) === 'object' ? require(${iconPath}).default : require(${iconPath})\n`
      }
      if (t.selectedIconPath) {
        const iconPath = stringify(join(dirname(this.resourcePath), t.selectedIconPath))
        tabBarCode += `tabbarSelectedIconPath[${i}] = typeof require(${iconPath}) === 'object' ? require(${iconPath}).default : require(${iconPath})\n`
      }
    }
  }

  const webComponents = `applyPolyfills().then(function () {
  defineCustomElements(window)
})
`

  const code = `
import "./public-path";
import { createRouter } from '@tarojs/taro'
import component from ${stringify(join(dirname(this.resourcePath), options.filename))}
import { ${creator}, window } from '@tarojs/runtime'
import { defineCustomElements, applyPolyfills } from '@tarojs/components/loader'
${importFrameworkStatement}
import '@tarojs/components/dist/taro-components/taro-components.css'
${extraImportForWeb || ''}
${webComponents}
var config = ${JSON.stringify(config)}
window.__taroAppConfig = config
${config.tabBar ? tabBarCode : ''}
if (config.tabBar) {
  var tabbarList = config.tabBar.list
  for (var i = 0; i < tabbarList.length; i++) {
    var t = tabbarList[i]
    if (t.iconPath) {
      t.iconPath = tabbarIconPath[i]
    }
    if (t.selectedIconPath) {
      t.selectedIconPath = tabbarSelectedIconPath[i]
    }
  }
}
config.routes = [
  ${config.pages?.map(path => genResource(path, pages, this)).join('')}
]
${execBeforeCreateWebApp || ''}

let appName = config.appName
let inst = null

// 非乾坤及母应用才渲染
if (!window.__POWERED_BY_QIANKUN__ && !window.__QIANKUN_PARENT__ ) {
  inst = ${creator}(component, ${frameworkArgs})
  createRouter(inst, config, ${importFrameworkName})
}

// qiankun 启动
export async function bootstrap() {
  console.log("[" + appName + "]" + "微应用启动" );
}

// 子应用挂载
export async function mount(props) {
  console.log("[" + appName + "]" + "微应用挂载" );
  inst = ${creator}(component, ${frameworkArgs})
  createRouter(inst, config, ${importFrameworkName})
  // 设置微应用属性
  window.__microProps = props
}

// 子应用卸载
export async function unmount(props) {
  console.log("[" + appName + "]" + "微应用卸载" );
  // const { container } = props;
  if(inst){

  }
  inst?inst.onUnMount():null;
}

`

  return code
}
