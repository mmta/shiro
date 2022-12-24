import { useContext, useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { ask } from '@tauri-apps/api/dialog'

import { cls } from '../components/const'
import { toastSuccess, toastError } from '../components/toast'
import { alertIfConnected, sleep, recoveryFileExist } from '../components/util'
import { Btc } from '../components/btc'

import derivationImage from '../assets/derivation.svg'
import Image from 'next/image'

import { useTranslation, Trans } from 'react-i18next'

import AppContext from '../components/appctx'

export default function Step1 () {
  const context = useContext(AppContext)
  const [seed, setSeed] = useState('')
  const [tempPass, setTempPass] = useState('')
  const [bipPassphrase, setBipPassphrase] = useState('')
  const [encryptDone, setEncryptDone] = useState(false)
  const [gpLoading, setGpLoading] = useState(false)
  const [gqLoading, setGqLoading] = useState(false)
  const [gmLoading, setGmLoading] = useState(false)
  const [enLoading, setEnLoading] = useState(false)
  const [deLoading, setDeLoading] = useState(false)
  const [recFile, setRecFile] = useState('')

  const { t } = useTranslation(['step1', 'common'])
  const discMsg = t('req-disconnect', { ns: 'common' })

  useEffect(() => {
    const f = async () => {
      const [exist, filename] = await recoveryFileExist()
      if (exist) {
        setRecFile(filename)
      } else {
        setRecFile('')
      }
    }
    f().catch(e => toastError(`Error: ${e}`))
  }, [encryptDone])

  const alertNetworkConnection = async setter => {
    if (context.checkNet) {
      setter(true)
      const res = await alertIfConnected(discMsg)
      setter(false)
      return res
    }
  }

  async function genPassphrase () {
    try {
      if (await alertNetworkConnection(setGpLoading)) return
      const res = await invoke('generate_passphrase', {})
      setTempPass(res)
      setEncryptDone(false)
    } catch (e) {
      toastError(`Error: ${e}`)
    }
  }

  async function genBipPassphrase () {
    try {
      if (await alertNetworkConnection(setGqLoading)) return
      const res = await invoke('generate_password', {})
      setBipPassphrase(res)
    } catch (e) {
      toastError(`Error: ${e}`)
    }
  }

  async function genMnemonic () {
    try {
      if (await alertNetworkConnection(setGmLoading)) return
      const res = await invoke('generate_mnemonic', {})
      setSeed(res)
      setEncryptDone(false)
    } catch (e) {
      toastError(`Error: ${e}`)
    }
  }

  async function encrypt () {
    try {
      if (await alertNetworkConnection(setEnLoading)) return
      try {
        await invoke('is_strong_passphrase', { pass: tempPass })
      } catch {
        return toastError(t('alert-1', { ns: 'common' }))
      }
      try {
        await invoke('is_strong_passphrase', { pass: bipPassphrase })
      } catch {
        return toastError(t('alert-2', { ns: 'common' }))
      }

      if (recFile) {
        const s = t('alert-3', { ns: 'common' }).replace('{{recFile}}', recFile)
        const yes = await ask(s, {
          title: 'Warning',
          type: 'warning'
        })
        if (!yes) return
      }

      await invoke('encrypt', {
        passphrase: tempPass,
        text: `${seed} :: ${bipPassphrase}`
      })
      toastSuccess(t('alert-4', { ns: 'common' }))
      setEncryptDone(true)
    } catch (e) {
      toastError(`Error: ${e}`)
    }
  }

  async function decrypt () {
    try {
      if (await alertNetworkConnection(setDeLoading)) return
      const res = await invoke('decrypt', { passphrase: tempPass })
      if (res === `${seed} :: ${bipPassphrase}`) {
        toastSuccess(t('alert-5', { ns: 'common' }))
      } else {
        toastError(`${t('alert-6', { ns: 'common' })}: ${res}`)
      }
    } catch (e) {
      toastError(`Error: ${e}`)
    }
  }

  async function explore () {
    try {
      await invoke('explore', { shouldOpen: true })
    } catch (e) {
      toastError(`Error: ${e}`)
    }
  }

  async function confirmBackup () {
    try {
      const [pub, addr] = await invoke('decrypt_and_get_addresses', {
        passphrase: tempPass
      })
      context.setQrSegwit(addr)
      context.setQrZpub(pub)
    } catch (e) {
      toastError(`Error: ${e}`)
      return
    }
    context.setPassphrase(tempPass)
    context.setPassphraseReady(true)
    setSeed('')
    setTempPass('')
    setBipPassphrase('')
    toastSuccess('Backup confirmed')
    await sleep(2000)
  }

  return (
    <div className='container'>
      <h1 className={cls.h1}>
        <i className='fa-circle-1'></i>{' '}
        <Trans t={t} i18nKey='title'>
          {' '}
          <Btc />{' '}
        </Trans>
      </h1>
      <p className={cls.p}>
        <Trans t={t} i18nKey='p-0-1'>
          {' '}
          <em></em> <em></em>{' '}
        </Trans>
      </p>
      <p className={`${cls.h1} mt-5 mb-5`}>
        <Image alt='key derivation' src={derivationImage} width={1300} />
      </p>

      <p className={cls.p}>{t('p-0-2')}</p>
      <p className={cls.p}>
      <>{' '}
        <Trans t={t} i18nKey='p-0-3'>
          {' '}
          <span className='is-underlined has-text-weight-semibold has-text-warning'>{' '}
          </span>
          {' '}
        </Trans>{' '}
      </>
      </p>

      <h2 className={cls.h2}>{t('h-1')}</h2>
      <p className={cls.p}>{t('p-1-1')}</p>
      <p className={cls.p}>
        <Trans t={t} i18nKey='p-1-2'>
          {' '}
          <a
            target='_blank'
            href='https://gnupg.org/download/#binary'
            rel='noreferrer'
          >
            {' '}
          </a>{' '}
        </Trans>
      </p>
      <h2 className={cls.h2}>{t('h-2')}</h2>
      <p className={cls.p}>
        <Trans t={t} i18nKey='p-2-1'>
          {' '}
          <strong> </strong>{' '}
        </Trans>
      </p>
      <h2 className={cls.h2}>{t('h-3')}</h2>
      <p className={cls.p}>
        <Trans t={t} i18nKey='p-3-1'>
          {' '}
          <strong> </strong>{' '}
        </Trans>
      </p>
      <p className={cls.p}>{t('p-3-2')}</p>

      <textarea
        className='textarea'
        data-testid='inpMnemonic'
        onChange={e => setSeed(e.currentTarget.value)}
        placeholder={t('p-3-2-1')}
        rows='2'
        value={seed}
      />
      <p className={`${cls.p} mt-3`}>
        <button
          type='button'
          data-testid='btnMnemonic'
          className={`${cls.button} ${gmLoading ? 'is-loading' : ''}`}
          onClick={() => genMnemonic()}
        >
          {t('p-3-2-2')}
        </button>
      </p>
      <p className={cls.p}>
        <Trans t={t} i18nKey='p-3-2-3'>
          {' '}
          <strong> </strong>{' '}
        </Trans>
      </p>
      <input
        className='input'
        type='text'
        id='inpBipPassphrase'
        data-testid='inpBipPassphrase'
        onChange={e => setBipPassphrase(e.currentTarget.value)}
        placeholder={t('p-3-2-4')}
        value={bipPassphrase || ''}
        readOnly={false}
      />
      <p className={`${cls.p} mt-3`}>
        <button
          type='button'
          data-testid='btnBipPassphrase'
          className={`${cls.button} ${gqLoading ? 'is-loading' : ''}`}
          onClick={() => genBipPassphrase()}
        >
          {t('p-3-2-5')}
        </button>
      </p>

      <h2 className={cls.h2}>{t('h-4')}</h2>
      <p className={cls.p}>{t('p-4-1')}</p>
      <input
        className='input'
        type='text'
        id='inpPassphrase'
        data-testid='inpPassphrase'
        onChange={e => setTempPass(e.currentTarget.value)}
        placeholder={t('p-4-1-1')}
        value={tempPass || ''}
        readOnly={false}
        required
      />
      <p className={`${cls.p} mt-3`}>
        <button
          type='button'
          data-testid='btnPassphrase'
          className={`${cls.button} ${gpLoading ? 'is-loading' : ''}`}
          onClick={() => genPassphrase()}
        >
          {t('p-4-1-2')}
        </button>
      </p>
      <p className={cls.p}>
        <Trans t={t} i18nKey='p-4-2'>
          {' '}
          <code> </code>{' '}
        </Trans>

        {recFile === ''
          ? ('')
          : (
          <>
            {' '}
            <Trans t={t} i18nKey='p-4-2-1'>
              {' '}
              <span className='is-underlined has-text-weight-bold has-text-warning'>
                {' '}
              </span>{' '}
            </Trans>{' '}
            {recFile}.
          </>
            )}
      </p>
      <button
        type='button'
        data-testid='btnEncrypt'
        className={`${cls.button} ${enLoading ? 'is-loading' : ''}`}
        onClick={() => encrypt()}
        disabled={
          !!(seed === '' || tempPass === '' || bipPassphrase === '')
        }
      >
        {t('p-4-2-2')}
      </button>
      <h2 className={cls.h2}>{t('h-5')}</h2>
      <p className={cls.p}>{t('p-5-1')}</p>
      <button
        type='button'
        data-testid='btnDecrypt'
        className={`${cls.button} ${deLoading ? 'is-loading' : ''}`}
        onClick={() => decrypt()}
        disabled={!!(encryptDone === false || tempPass === '')}
      >
        {t('p-5-1-1')}
      </button>
      <p className={`${cls.p} mt-3`}>
        <Trans t={t} i18nKey='p-5-2'>
          {' '}
          <code> </code>{' '}
        </Trans>
        <code>::</code>.
      </p>
      <button
        type='button'
        className={cls.button}
        data-testid='btnExplore'
        disabled={!!(encryptDone === false || tempPass === '')}
        onClick={() => explore()}
      >
        {t('p-5-2-1')}
      </button>
      <h2 className={cls.h2}>{t('h-6')}</h2>
      <p className={cls.p}>{t('p-6-1')}</p>
      <p className={cls.p}>{t('p-6-2')}</p>
      <p className={cls.p}>{t('p-6-3')}</p>
      <p className={cls.p}>{t('p-6-4')}</p>
      <button
        type='button'
        className={cls.button}
        data-testid='btnConfirmBackup'
        disabled={!!(encryptDone === false || tempPass === '')}
        onClick={async () => confirmBackup()}
      >
        {t('p-6-4-1')}
      </button>
      <h2 className={cls.h2}>{t('h-7')}</h2>
      <p className={cls.p}>
        <Trans t={t} i18nKey='p-7-1'>
          {' '}
          <code> </code>{' '}
        </Trans>
      </p>
      <p className={cls.p}>{t('p-7-2')}</p>
    </div>
  )
}
