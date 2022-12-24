import { useContext } from 'react'

import { cls } from '../components/const'
import Unlock from '../components/unlock'

import AppContext from '../components/appctx'

import Sign from '../components/sign'

import { useTranslation, Trans } from 'react-i18next'

export default function Step3 () {
  const context = useContext(AppContext)

  const { t } = useTranslation('step3')

  /*
  these are to disable Unlock temporarily
  context.setPassphraseReady(true)
  */

  return (
    <div className='container'>
      <h1 className={cls.h1}>{t('title')}</h1>
      {context.passphraseReady
        ? (
        <>
          <p className={cls.p}>{t('p-0-1')}</p>
          <p className={cls.p}>
            <Trans t={t} i18nKey='p-0-2'>
              {' '}
              <em></em>{' '}
            </Trans>
          </p>
          <p className={cls.p}>
            <Trans t={t} i18nKey='p-0-3'>
              {' '}
              <em></em>{' '}
            </Trans>
          </p>

          <p className={cls.p}>{t('p-0-4')}</p>
          <h2 className={cls.h2}>{t('h-1')}</h2>
          <p className={cls.p}>{t('p-1-1')}</p>

          <h2 className={cls.h2}>{t('h-2')}</h2>
          <p className={cls.p}>{t('p-2-1')}</p>

          <h2 className={cls.h2}>{t('h-3')}</h2>
          <p className={cls.p}>{t('p-3-1')}</p>
          <p className={cls.p}>{t('p-3-2')}</p>
          <Sign />

          <h2 className={cls.h2}>{t('h-4')}</h2>
          <p className={cls.p}>{t('p-4-1')}</p>
          <p className={cls.p}>{t('p-4-2')}</p>

          <h2 className={cls.h2}>{t('h-5')}</h2>
          <p className={cls.p}>{t('p-5-1')}</p>

          <h4 className={cls.h4}>{t('p-5-2')}</h4>
          <p className={cls.p}>
            <Trans t={t} i18nKey='p-5-3'>
              {' '}
              <a href='https://coldcard.com/' target='_blank' rel='noreferrer'>
                {' '}
              </a>{' '}
            </Trans>
          </p>
          <h4 className={cls.h4}>{t('p-5-4')}</h4>
          <p className={cls.p}>{t('p-5-5')}</p>
          <p className={cls.p}>
            <Trans t={t} i18nKey='p-5-6'>
              {' '}
              <code></code>{' '}
            </Trans>
          </p>
          <p className={cls.p}>
            <code>C:\shiro\{'>'} shiro.exe --signer</code>
          </p>
          <p className={cls.p}>{t('p-5-7')}</p>
          <h4 className={cls.h4}>{t('p-5-8')}</h4>
          <p className={cls.p}>
            <Trans t={t} i18nKey='p-5-9'>
              {' '}
              <a href='https://airgap.it/' target='_blank' rel='noreferrer'>
                {' '}
              </a>{' '}
            </Trans>
          </p>
          <p></p>
        </>
          )
        : (
        <Unlock />
          )}
    </div>
  )
}
