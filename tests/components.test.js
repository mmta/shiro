import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/react'
import Footer from '../src/components/footer'
import {
  ctx,
  renderer,
  mockedi18next,
  mockedConfig,
  mockedStaticSite
} from './mocks'
import Layout from '../src/components/layout'
import locales from '../src/components/locales'

jest.mock('next/config', () => mockedConfig)
jest.mock('react-i18next', () => mockedi18next)
jest.mock('next-i18next-static-site', () => mockedStaticSite)

describe('Footer component', () => {
  it('renders a footer', async () => {
    renderer(<Footer />)
    const items = await screen.findAllByRole('generic')
    expect(items).toHaveLength(3)
  })
})

describe('Layout component', () => {
  it('renders a layout', async () => {
    ctx.loaded = true
    renderer(<Layout />)
    const items = await screen.findAllByRole('generic')
    expect(items).toHaveLength(7)
  })

  describe('Locales component', () => {
    it('has the en locale', () => {
      expect(locales.en.common).toBeDefined()
    })
  })
})
