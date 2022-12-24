import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor, act, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockIPC } from '@tauri-apps/api/mocks'
import {
  ctx,
  mockedi18next,
  mockedConfig,
  mockedStaticSite,
  renderer
} from './mocks'
import Index from '../src/pages/index'
import Step2 from '../src/pages/step2'
import Step3 from '../src/pages/step3'
import Maintenance from '../src/pages/maintenance'
import MyApp from '../src/pages/_app'
import Document from '../src/pages/_document'
import { sleep } from '../src/components/util'

import React from 'react'

jest.mock('react-i18next', () => mockedi18next)
jest.mock('next/config', () => mockedConfig)
jest.mock('next-i18next-static-site', () => mockedStaticSite)

const actClicker = async el => {
  await act(async () => {
    el.click()
    await sleep(50)
  })
}

describe('loads the app and document', () => {
  const def = () => ['', () => null]
  for (let i = 1; i <= 9; i++) {
    jest.spyOn(React, 'useState').mockImplementationOnce(def)
  }

  it('renders the app page and doc', async () => {
    const v = {
      Component: Document
    }
    render(MyApp(v))
    const items = await screen.findAllByRole('generic')
    expect(items).toHaveLength(2)
  })
})

describe('Intro page', () => {
  it('renders an intro page', () => {
    ctx.loaded = true
    ctx.signerMode = false
    renderer(<Index />)
    // just get the first and last one
    expect(screen.getByText('p-0-1')).toBeInTheDocument()
    expect(screen.getByText('p-3-2')).toBeInTheDocument()
  })

  it('doesnt render an intro page', () => {
    ctx.signerMode = true
    renderer(<Index />)
    expect(screen.queryByText('p-0-1')).toBeNull()
  })
})

describe('Step2 page', () => {
  it('renders an Unlock page', async () => {
    ctx.passphraseReady = false
    renderer(<Step2 />)
    expect(screen.getByText('unlock-2')).toBeInTheDocument()

    const inpPassphrase = screen.queryByTestId('inpPassphrase')
    await userEvent.type(inpPassphrase, 'foo')

    mockIPC((cmd, args) => {
      if (cmd === 'decrypt_and_get_addresses') {
        if (args.passphrase === 'valid') {
          return ['pub', 'addr']
        } else Promise.reject(new Error('simulated err from rust'))
      }
    })

    ctx.passphrase = 'valid'
    const btnShow = screen.queryByTestId('btnDecrypt')
    ctx.checkNet = true
    await actClicker(btnShow)
    ctx.checkNet = false
    await actClicker(btnShow)
  })

  it('renders a Step2 page', async () => {
    ctx.passphraseReady = true
    ctx.qrSegwit = 'foo'
    ctx.qrZpub = 'bar'
    renderer(<Step2 />)
    expect(screen.getByText('p-1-1')).toBeInTheDocument()

    const btnShow = screen.queryByTestId('btnShow')
    await actClicker(btnShow)
    // this is not idempotent
    await waitFor(() => {
      expect(btnShow).toHaveTextContent('p-2-2-1')
      expect(screen.getByText(ctx.qrZpub)).toBeInTheDocument()
    })
  })
})

describe('Step3 page', () => {
  it('renders an Unlock page', () => {
    ctx.passphraseReady = false
    renderer(<Step3 />)
    expect(screen.getByText('unlock-2')).toBeInTheDocument()
  })
  it('renders a Step3 page', () => {
    ctx.passphraseReady = true
    renderer(<Step3 />)
    expect(screen.getByText('p-1-1')).toBeInTheDocument()
  })
})

describe('Maintenance page', () => {
  it('renders a Maintenance page', () => {
    renderer(<Maintenance />)
    expect(screen.getByText('p-0-1')).toBeInTheDocument()
  })
})
