import { initTabbar } from './tabbar'
import { setHistoryMode } from './history'
import { RouterConfig } from './router'

export const routerConfig: RouterConfig = Object.create(null)

export function init(config: RouterConfig) {
  config.router.mode = config.router.mode || 'hash'
  setHistoryMode(config.router.mode, config.router.basename)
  Object.assign(routerConfig, config)
  // document.getElementById('app')?.remove()

  // 添加taro节点到app节点
  const appName = config.appName || ''

  const appId = appName != '' ? 'app' + '_' + appName :'app';

  document.getElementById(appId)?.remove()

  const root = document.getElementById(appName) || document.body

  const container = document.createElement('div')
  container.classList.add('taro-tabbar__container')
  container.id = 'container'

  const panel = document.createElement('div')
  panel.classList.add('taro-tabbar__panel')

  const app = document.createElement('div')

  app.id = appId
  app.classList.add('taro_router')

  panel.appendChild(app)
  container.appendChild(panel)

  // document.body.appendChild(container)
  root.appendChild(container)

  initTabbar(config)
}
