import { useTranslation } from 'react-i18next'
import getConfig from 'next/config'

const { publicRuntimeConfig } = getConfig()

const options = publicRuntimeConfig.i18n.languages.map((v, index) => {
  return {
    locale: v,
    label: publicRuntimeConfig.i18n.labels[index]
  }
})

const LanguageMenu = () => {
  const { i18n } = useTranslation()
  const changeLanguage = lng => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className='select is-rounded'>
      <select onChange={e => changeLanguage(e.target.value)}>
        {options.map(v => (
          <option key={v.locale} value={v.locale}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default LanguageMenu
