import { promises as fs } from 'fs'
import path from 'path'

const REF_LANG = 'en'

// these sections use the same text as the reference language (en)
const whitelist = [
  {
    lang: 'id',
    fileName: 'common.json',
    tag: 'step-0'
  },
  {
    lang: 'id',
    fileName: 'signer.json',
    tag: 'title'
  },
  {
    lang: 'id',
    fileName: 'step3.json',
    tag: 'p-5-2'
  }
]

describe('Translation', () => {
  const failTest = text => {
    throw new Error(text)
  }

  it('has complete translation', async () => {
    expect(async () => {
      checkTranslations()
    }).not.toThrow()
  })

  const build = async (localeDir, lang) => {
    const p = path.join(localeDir, lang)
    const files = await fs.readdir(p)
    const obj = []
    for (const file of files) {
      const content = await fs.readFile(path.join(p, file))
      const json = JSON.parse(content)
      const o = {
        [file]: json
      }
      obj.push(o)
    }
    return obj
  }

  const checkTranslations = async () => {
    const localeDir = path.join(__dirname, '..', 'src', 'locales')
    let langDirs = await fs.readdir(localeDir)
    langDirs = langDirs.filter(item => item !== REF_LANG)
    const ref = await build(localeDir, REF_LANG)

    for (const fileIdx in ref) {
      const file = ref[fileIdx]
      const fileName = Object.keys(file)[0]
      for (const contentIdx in file) {
        const content = file[contentIdx]
        for (const [tag, text] of Object.entries(content)) {
          for (const lang of langDirs) {
            const target = await build(localeDir, lang)
            let o
            try {
              o = target.filter(item => fileName in item)[0][fileName]
            } catch (e) {
              failTest(
                `translation error for '${lang}': file ${fileName} is missing`
              )
            }
            if (o[tag] === undefined) {
              failTest(
                `translation error for '${lang}': cannot find entry in ${fileName} for ${tag}`
              )
            }
            if (o[tag] === text && text !== '') {
              if (
                whitelist.find(
                  k =>
                    k.lang === lang && k.fileName === fileName && k.tag === tag
                ) === undefined
              ) {
                failTest(
                  `translation error for '${lang}': entry in ${fileName} for ${tag} is '${text}'`
                )
              }
            }
            // console.log(`OK: ${lang} has entry for ${fileName} - ${tag}`)
          }
        }
      }
    }
  }
})
