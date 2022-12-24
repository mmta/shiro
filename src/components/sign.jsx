import { useContext, useState } from 'react'
import AppContext from './appctx'
import { cls } from './const'
import { toastError, toastSuccess } from './toast'
import { alertIfConnected, base64ToArrayBuffer } from './util'
import { invoke } from '@tauri-apps/api/tauri'
import QRCode from 'react-qr-code'
import Tippy from '@tippyjs/react'

import { save } from '@tauri-apps/api/dialog'
import { writeTextFile, writeBinaryFile } from '@tauri-apps/api/fs'

import { useTranslation } from 'react-i18next'

export default function Sign () {
  const context = useContext(AppContext)
  const [txVisible, setTxVisible] = useState(false)
  const [gpLoading, setGpLoading] = useState(false)

  const [passphrase, setPassphrase] = useState('')
  const [psbt, setPsbt] = useState('')
  const [signed, setSigned] = useState('')
  const [signedPsbt, setSignedPsbt] = useState()

  const { t } = useTranslation(['common'])
  const discMsg = t('req-disconnect', { ns: 'common' })

  const wrappedSetPsbt = v => {
    if (context.passphrase) {
      context.setPsbt(v)
    }
    setPsbt(v)
  }
  const wrappedSetSigned = v => {
    if (context.signed) {
      context.setSigned(v)
    }
    setSigned(v)
  }

  const saveFile = async (isPsbt, content) => {
    try {
      const ext = isPsbt ? 'psbt' : 'txt'
      const extName = isPsbt ? 'PSBT File' : 'Text File'
      let filePath = await save({
        filters: [
          {
            name: extName,
            extensions: [ext]
          }
        ]
      })
      if (!filePath) return
      const v = filePath.split('.').pop()
      if (v === filePath || v !== ext) {
        filePath = `${filePath}.${ext}`
      }

      if (isPsbt) {
        await writeBinaryFile(filePath, content, {})
      } else {
        await writeTextFile(filePath, content, {})
      }
      toastSuccess(t('sign-1') + ` ${filePath}`)
    } catch (e) {
      toastError(`Error: ${e}`)
    }
  }

  const alertNetworkConnection = async setter => {
    if (context.checkNet) {
      setter(true)
      const res = await alertIfConnected(discMsg)
      setter(false)
      return res
    }
  }

  const signPsbt = async (passphrase, psbt) => {
    try {
      if (await alertNetworkConnection(setGpLoading)) return
      const x = context.passphrase ? context.passphrase : passphrase
      const y = context.psbt ? context.psbt : psbt
      const [signedTx, signedP] = await invoke('sign_psbt', {
        passphrase: x,
        psbt: y
      })

      wrappedSetSigned(signedTx)
      const buf = base64ToArrayBuffer(signedP)
      setSignedPsbt(buf)

      toastSuccess(t('sign-2'))
      return true
    } catch (e) {
      toastError(`Error: ${e}`)
      return false
    }
  }

  return (
    <>
      {context.passphrase
        ? (
            ''
          )
        : (
        <p className={`${cls.p} mt-3`}>
          <input
            className='input'
            type='password'
            onChange={e => setPassphrase(e.currentTarget.value)}
            value={passphrase}
            placeholder={t('sign-3')}
            data-testid='inpPassphrase'
          />
        </p>
          )}
      <textarea
        className='textarea'
        onChange={e => wrappedSetPsbt(e.currentTarget.value)}
        placeholder={t('sign-4')}
        rows='5'
        value={psbt}
        data-testid='inpPsbt'
      />
      <p className={`${cls.p} mt-3`}>
        <button
          type='button'
          className={`${cls.button} ${gpLoading ? 'is-loading' : ''}`}
          data-testid='btnSign'
          onClick={async () => {
            if (!txVisible) {
              if ((await signPsbt(passphrase, psbt)) === false) return
            }
            setTxVisible(txVisible => !txVisible)
          }}
        >
          {txVisible ? t('sign-5') : t('sign-6')}
        </button>
      </p>

      {txVisible && signed !== ''
        ? (
        <div className='mt-3'>
          <p className={cls.p}>
            <QRCode
              size={64}
              style={{ height: 'auto', maxWidth: '50%', width: '50%' }}
              value={signed}
              viewBox={'0 0 64 64'}
            />
          </p>
          <p className={cls.p}>
            <Tippy content={t('sign-9')}>
            <code
              data-tip
              data-for='txCodeTip'
              className='wrap'
              data-testid='outQrCode'
            >
              {signed}
            </code>
            </Tippy>
          </p>

          <p className={cls.p}>
            <Tippy content={t('sign-10')}>
            <button
              data-tip
              data-for='saveTxTip'
              type='button'
              className={`${cls.button} mr-3`}
              data-testid='btnSaveTx'
              onClick={() => saveFile(false, signed)}
            >
              {t('sign-7')}
            </button>
            </Tippy>
            <Tippy content={t('sign-11')} >
            <button
              data-tip
              data-for='savePsbtTip'
              type='button'
              className={cls.button}
              data-testid='btnSavePsbt'
              onClick={() => saveFile(true, signedPsbt)}
            >
              {t('sign-8')}
            </button>
            </Tippy>
            </p>
        </div>
          )
        : null}
    </>
  )
}
