import Navbar from './navbar'
import { useEffect, useContext } from 'react'
import { getMatches } from '@tauri-apps/api/cli'
import Signer from '../pages/signer'

import AppContext from '../components/appctx'

export default function Layout ({ children }) {
  const context = useContext(AppContext)

  useEffect(() => {
    getMatches()
      .then(matches => {
        if (matches.args?.signer?.value) {
          context.SetSignerMode(true)
        }
      })
      .catch(e => {})
      .finally(() => context.setLoaded(true))
  })

  return (
    <>
      {context.loaded
        ? (
            context.signerMode
              ? (
          <>
            <Signer />
          </>
                )
              : (
          <>
            <Navbar />
            <main>{children}</main>
          </>
                )
          )
        : (
            ''
          )}
    </>
  )
}
