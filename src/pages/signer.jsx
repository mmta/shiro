import { useEffect, useState } from 'react'
import { cls } from '../components/const'
import { Btc } from '../components/btc'

import Sign from '../components/sign'
import { toastError } from '../components/toast'

import { recoveryFileExist } from '../components/util'
import LanguageMenu from '../components/lang'

import { useTranslation, Trans } from 'react-i18next'

export default function Signer () {
  const [recFile, setRecFile] = useState('')
  const { t } = useTranslation('signer')

  useEffect(() => {
    const f = async () => {
      const [, fileName] = await recoveryFileExist()
      setRecFile(fileName)
    }
    f().catch(e => toastError(`Error: ${e}`))
  }, [])

  return (
    <div className='container'>
      <nav className='navbar level is-fixed-top box has-text-white has-background-grey-dark'>
        <div className='level-left'></div>
        <div className='level-right'>
          <div className='level-item'>
            <LanguageMenu />
          </div>
        </div>
      </nav>
      <br></br>
      <br></br>
      <br></br>
      <h1 className={cls.h1}>
        <Trans t={t} i18nKey='title'>
          {' '}
          <Btc />{' '}
        </Trans>
      </h1>
      <ol className='ml-5'>
        <li>
          <Trans t={t} i18nKey='p-0-1'>
            {' '}
            <code>{{ recFile }}</code>{' '}
          </Trans>
          .
        </li>
        <li>{t('p-0-2')}</li>
        <li>{t('p-0-3')}</li>
        <li>{t('p-0-4')}</li>
        <li>{t('p-0-5')}</li>
      </ol>
      <Sign />
    </div>
  )
}
