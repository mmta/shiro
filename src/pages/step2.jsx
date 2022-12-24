import { useState, useContext } from 'react'
import QRCode from 'react-qr-code'

import { cls } from '../components/const'
import Unlock from '../components/unlock'

import AppContext from '../components/appctx'
import { useTranslation, Trans } from 'react-i18next'

export default function Step2 () {
  const context = useContext(AppContext)
  const [pubkeyVisible, setPubkeyVisible] = useState(false)

  const { t } = useTranslation('step2')

  /*
  these are to disable Unlock temporarily

  context.setPassphraseReady(true)
  context.setQrSegwit('a')
  context.setQrZpub('b')
  */

  return (
    <div className='container'>
      <h1 className={cls.h1}>{t('title')}</h1>
      {context.passphraseReady &&
      context.qrSegwit !== '' &&
      context.qrZpub !== ''
        ? (
        <>
          <p className={cls.p}>
            <Trans t={t} i18nKey='p-0-1'>
              {' '}
              <em></em>{' '}
            </Trans>
          </p>
          <h2 className={cls.h2}>
            <Trans t={t} i18nKey='h-1'>
              {' '}
              <a
                target='_blank'
                href='https://apps.apple.com/us/app/bluewallet-bitcoin-wallet/id1376878040'
                rel='noreferrer'
              >
                {' '}
              </a>{' '}
              <a
                target='_blank'
                href='https://play.google.com/store/apps/details?id=io.bluewallet.bluewallet&hl=en&gl=US'
                rel='noreferrer'
              >
                {' '}
              </a>
            </Trans>
          </h2>
          <p className={cls.p}>{t('p-1-1')}</p>
          <h2 className={cls.h2}>{t('h-2')}</h2>
          <p className={cls.p}>{t('p-2-1')}</p>
          <p className={cls.p}>{t('p-2-2')}</p>
          <button
            type='button'
            className={cls.button}
            data-testid='btnShow'
            onClick={() => setPubkeyVisible(pubkeyVisible => !pubkeyVisible)}
          >
            {pubkeyVisible ? t('p-2-2-1') : t('p-2-2-2')} Extended Public key
          </button>
          {pubkeyVisible && context.qrZpub !== ''
            ? (
            <div>
              <p className={`${cls.p} mt-3`}>
                <code>{context.qrZpub}</code>
              </p>
              <QRCode
                size={64}
                viewBox={'0 0 64 64'}
                style={{ height: 'auto', maxWidth: '50%', width: '50%' }}
                value={context.qrZpub}
              ></QRCode>
            </div>
              )
            : null}

          <h2 className={cls.h2}>{t('h-3')}</h2>
          <p className={cls.p}>
            <Trans t={t} i18nKey='p-3-1'>
              {' '}
              <strong></strong>{' '}
            </Trans>
          </p>
          <p className={cls.p}>
            <code>{context.qrSegwit}</code>
          </p>
          <p className={cls.p}>{t('p-3-2')}</p>
          <p className={cls.p}>{t('p-3-3')}</p>
          <p className={cls.p}>{t('p-3-4')}</p>

          <h2 className={cls.h2}>{t('h-4')}</h2>
          <p className={cls.p}>{t('p-4-1')}</p>
          <p className={cls.p}>{t('p-4-2')}</p>
          <p className={cls.p}>{t('p-4-3')}</p>

          <h2 className={cls.h2}>{t('h-5')}</h2>
          <p className={cls.p}>{t('p-5-1')}</p>
          <ul className='ml-5'>
            <li>{t('p-5-1-1')}</li>
            <li>{t('p-5-1-2')}</li>
            <li>{t('p-5-1-3')}</li>
          </ul>
        </>
          )
        : (
        <Unlock />
          )}
    </div>
  )
}
