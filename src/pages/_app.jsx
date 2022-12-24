import '@fortawesome/fontawesome-free/js/all.min.js'
import '@fontsource/ubuntu/500-italic.css'
import '@fontsource/roboto/400.css'

import '../styles.scss'

import 'react-toastify/dist/ReactToastify.css'
import Layout from '../components/layout'
import Footer from '../components/footer'
import { useState } from 'react'
import AppContext from '../components/appctx'
import { ToastContainer } from 'react-toastify'

import {
  I18nProvider,
  languages,
  defaultLanguage,
  namespaces,
  defaultNamespace
} from 'next-i18next-static-site'

// Locales loader
import locales from '../components/locales'

export default function MyApp ({ Component, pageProps }) {
  const [checkNet, setCheckNet] = useState(true)
  const [passphraseReady, setPassphraseReady] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [qrSegwit, setQrSegwit] = useState('')
  const [qrZpub, setQrZpub] = useState('')
  const [signed, setSigned] = useState('')
  const [psbt, setPsbt] = useState('')

  const [loaded, setLoaded] = useState(false)
  const [signerMode, SetSignerMode] = useState(false)

  const i18n = {
    languages,
    defaultLanguage,
    namespaces,
    defaultNamespace,
    locales
  }

  return (
    <I18nProvider i18n={i18n}>
      <AppContext.Provider
        value={{
          checkNet,
          setCheckNet,
          passphraseReady,
          setPassphraseReady,
          passphrase,
          setPassphrase,
          qrSegwit,
          setQrSegwit,
          qrZpub,
          setQrZpub,
          psbt,
          setPsbt,
          signed,
          setSigned,
          signerMode,
          SetSignerMode,
          loaded,
          setLoaded
        }}
      >
        <Layout />
        <Component {...pageProps} />
        <Footer />
        <ToastContainer />
      </AppContext.Provider>
    </I18nProvider>
  )
}
