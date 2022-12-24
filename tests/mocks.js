import AppContext from '../src/components/appctx'
import { ToastContainer } from 'react-toastify'
import { render } from '@testing-library/react'
import React from 'react'

export const mockedi18next = {
  Trans: ({ children }) => renderNodes(children),
  useTranslation: () => {
    return {
      t: str => str,
      i18n: {
        /* changeLanguage: () => new Promise(() => {}) */
      }
    }
  }
}

export const mockedStaticSite = {
  I18nProvider: () => {
    return <div></div>
  },
  languages: ['en', 'id'],
  labels: ['English', 'Indonesian'],
  defaultLanguage: 'en',
  namespaces: [
    'common',
    'intro',
    'step1',
    'step2',
    'step3',
    'maintenance',
    'signer'
  ]
}

export const mockedConfig = () => {
  const publicRuntimeConfig = {
    i18n: {
      labels: ['English'],
      languages: ['en']
    }
  }
  return { publicRuntimeConfig }
}

export const ctx = {
  checkNet: false,
  passphrase: '',
  psbt: '',
  loaded: true,
  signerMode: false,
  passphraseReady: false,
  qrSegwit: '',
  qrZpub: 'bar',
  setPassphrase: () => '',
  setQrSegwit: () => '',
  setQrZpub: () => '',
  setPsbt: () => '',
  setPassphraseReady: () => true,
  setLoaded: () => true
}

export const renderer = c => {
  render(
    <AppContext.Provider value={ctx}>
      {c}
      <ToastContainer />
    </AppContext.Provider>
  )
}

const hasChildren = node =>
  node && (node.children || (node.props && node.props.children))

const getChildren = node =>
  node && node.children ? node.children : node.props && node.props.children

const renderNodes = reactNodes => {
  if (typeof reactNodes === 'string') {
    return reactNodes
  }

  return Object.keys(reactNodes).map((key, i) => {
    const child = reactNodes[key]

    if (typeof child === 'string') {
      return child
    } else if (hasChildren(child)) {
      const inner = renderNodes(getChildren(child))
      return React.cloneElement(child, { ...child.props, key: i }, inner)
    }

    return child
  })
}
