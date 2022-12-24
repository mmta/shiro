import { cls } from '../components/const'
import { Btc } from '../components/btc'

import AppContext from '../components/appctx'
import { useContext } from 'react'

import { useTranslation, Trans } from 'react-i18next'

export default function Index () {
  const context = useContext(AppContext)
  const { t } = useTranslation('intro')

  return (
    <>
      {context.loaded && context.signerMode === false
        ? (
        <div className='container'>
          <h1 className={cls.h1}>
            <Trans t={t} i18nKey='title'>
              {' '}
              <Btc />{' '}
            </Trans>
          </h1>

          <div className='container'>
            <p className={cls.p}>{t('p-0-1')}</p>
            <p className={cls.p}>{t('p-0-2')}</p>
            <p className={cls.p}>{t('p-0-3')}</p>
            <h2 className={cls.h2}>{t('h-1')}</h2>
            <p className={cls.p}>{t('p-1-1')}</p>
            <h2 className={cls.h2}>{t('h-2')}</h2>
            <p className={cls.p}>{t('p-2-1')}</p>
            <p className={cls.p}>{t('p-2-2')}</p>
            <h2 className={cls.h2}>{t('h-3')}</h2>
            <p className={cls.p}>{t('p-3-1')}</p>
            <p className={cls.p}>{t('p-3-2')}</p>
          </div>
        </div>
          )
        : (
            ''
          )}
    </>
  )
}
