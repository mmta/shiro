// lib/locales.js
import { languages, namespaces } from 'next-i18next-static-site'

const locales = {}
languages.forEach(language => {
  locales[language] = {}

  namespaces.forEach(namespace => {
    locales[language][namespace] = require('./../locales/' +
      language +
      '/' +
      namespace +
      '.json')
  })
})

export default locales
