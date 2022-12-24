import Link from 'next/link'

import AppContext from './appctx'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageMenu from './lang'
import Tippy from '@tippyjs/react'

export default function Navbar () {
  const context = useContext(AppContext)
  const { t } = useTranslation('common')

  return (
    <>
      <nav className='navbar level is-fixed-top box has-text-white has-background-grey-dark'>
        <div className='level-left'>
          <div className='level-item breadcrumb has-arrow-separator'>
            <ul>
              <li>
                <Link href='/'>{t('step-0')}</Link>
              </li>
              <li>
                <Link href='/step1'>{t('step-1')}</Link>
              </li>
              <li>
                <Link href='/step2'>{t('step-2')}</Link>
              </li>
              <li>
                <Link href='/step3'>{t('step-3')}</Link>
              </li>
              <li>
                <Link href='/maintenance'>{t('step-4')}</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className='level-right'>
          <p className='level-item'>
            <label className='checkbox'>
            <Tippy content={t('net-tip')}>
              <input
                className='cbox'
                type='checkbox'
                onChange={e => context.setCheckNet(v => !v)}
                checked={context.checkNet}
              />
            </Tippy>
              &nbsp;&nbsp;&nbsp;{t('net-label')}
            </label>
          </p>
          <div className='level-item'>
            <LanguageMenu />
          </div>
        </div>
      </nav>
      <br></br>
      <br></br>
      <br></br>
    </>
  )
}
