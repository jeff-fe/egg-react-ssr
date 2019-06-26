import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, StaticRouter, Route } from 'react-router-dom'
import defaultLayout from '@/layout'
import { getWrappedComponent, getComponent } from 'ykfe-utils'
import { routes as Routes } from '../config/config.default'

const clientRender = async () => {
  // 客户端渲染||hydrate
  ReactDOM[window.__USE_SSR__ ? 'hydrate' : 'render'](
    <BrowserRouter>
      {
        // 使用高阶组件getWrappedComponent使得csr首次进入页面以及csr/ssr切换路由时调用getInitialProps
        Routes.map(({ path, exact, Component }, key) => {
          const activeComponent = Component()
          const Layout = activeComponent.Layout || defaultLayout
          return <Route exact={exact} key={key} path={path} render={() => {
            const WrappedComponent = getWrappedComponent(activeComponent)
            return <Layout><WrappedComponent /></Layout>
          }} />
        })
      }
    </BrowserRouter>
    , document.getElementById('app'))

  if (process.env.NODE_ENV === 'development' && module.hot) {
    module.hot.accept()
  }
}

const serverRender = async (ctx) => {
  // 服务端渲染 根据ctx.path获取请求的具体组件，调用getInitialProps并渲染
  const activeComponent = getComponent(Routes, ctx.path)()
  const serverData = activeComponent.getInitialProps ? await activeComponent.getInitialProps(ctx) : {}
  const Layout = activeComponent.Layout || defaultLayout
  ctx.serverData = serverData
  const WrappedComponent = getWrappedComponent(activeComponent)

  return <StaticRouter location={ctx.req.url} context={serverData}>
    <Layout>
      <WrappedComponent {...serverData} />
    </Layout>
  </StaticRouter>
}

export default __isBrowser__ ? clientRender() : serverRender