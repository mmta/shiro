import { useContext, useState, useEffect } from 'react'
import AppContext from '../components/appctx'
import { cls } from './const'
import { toastError, toastSuccess } from './toast'
import { alertIfConnected, sleep, recoveryFileExist } from './util'
import { invoke } from '@tauri-apps/api/tauri'

import { useTranslation } from 'react-i18next'

export default function Unlock () {
  const context = useContext(AppContext)
  const [loading, setLoading] = useState(false)
  const [recFile, setRecFile] = useState('')

  const { t } = useTranslation(['common'])
  const discMsg = t('req-disconnect', { ns: 'common' })

  useEffect(() => {
    const f = async () => {
      const [, fileName] = await recoveryFileExist()
      setRecFile(fileName)
    }
    f().catch(e => toastError(`Error: ${e}`))
  }, [])

  const alertNetworkConnection = async setter => {
    if (context.checkNet) {
      setter(true)
      const res = await alertIfConnected(discMsg)
      setter(false)
      return res
    }
  }

  async function decryptAndGetAddresses () {
    try {
      if (await alertNetworkConnection(setLoading)) return

      const [pub, addr] = await invoke('decrypt_and_get_addresses', {
        passphrase: context.passphrase
      })
      toastSuccess(t('unlock-1'))
      context.setQrSegwit(addr)
      context.setQrZpub(pub)
      await sleep(2000)
      context.setPassphraseReady(true)
    } catch (e) {
      toastError(`Error: ${e}`)
    }
  }

  return (
    <>
      <h2 className={cls.h2}>{t('unlock-2')}</h2>
      <p className={cls.p}>{t('unlock-3')}</p>
      <ul className='mb-3 ml-5'>
        <li>{t('unlock-4')}</li>
        <li>
          {t('unlock-5')} <code>{recFile}</code>.
        </li>
        <li>{t('unlock-6')}</li>
      </ul>
      <p className={cls.p}>{t('unlock-7')}</p>
      <input
        className='input'
        type='password'
        data-testid='inpPassphrase'
        onChange={e => context.setPassphrase(e.currentTarget.value)}
        value={context.passphrase}
      />
      <p className={`${cls.p} mt-3`}>
        <button
          type='button'
          data-testid='btnDecrypt'
          className={`${cls.button} ${loading ? 'is-loading' : ''}`}
          onClick={() => decryptAndGetAddresses()}
        >
          {t('unlock-8')}
        </button>
      </p>
    </>
  )
}
