import { cls } from '../components/const'

import { useTranslation } from 'react-i18next'

export default function Maintenance () {
  const { t } = useTranslation('maintenance')

  return (
    <div className='container'>
      <h1 className={cls.h1}>{t('title')}</h1>
      <p className={cls.p}>{t('p-0-1')}</p>
      <p>{t('p-0-2')}</p>
      <ul className='mt-3 mb-3 ml-5'>
        <li>{t('p-0-2-1')}</li>
        <li>{t('p-0-2-2')}</li>
        <li>{t('p-0-2-3')}</li>
        <li>{t('p-0-2-4')}</li>
        <li>{t('p-0-2-5')}</li>
      </ul>
      <p className={cls.p}>{t('p-0-3')}</p>
      <p className={cls.p}>{t('p-0-4')}</p>
      <ul className='mt-3 mb-3 ml-5'>
        <li>{t('p-0-4-1')}</li>
        <li>{t('p-0-4-2')}</li>
        <li>{t('p-0-4-3')}</li>
      </ul>
      <p className={cls.p}>{t('p-0-5')}</p>
    </div>
  )
}
