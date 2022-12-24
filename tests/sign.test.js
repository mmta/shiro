import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'
import { mockIPC } from '@tauri-apps/api/mocks'
import { fireEvent, screen, waitFor, within, act } from '@testing-library/react'
import { ctx, mockedi18next, renderer } from './mocks'
import Sign from '../src/components/sign'
import { sleep } from '../src/components/util'

jest.mock('react-i18next', () => mockedi18next)

const actClicker = async el => {
  await act(async () => {
    el.click()
    await sleep(50)
  })
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('Sign page', () => {
  it('renders a sign page', () => {
    ctx.passphrase = ''
    renderer(<Sign />)
    expect(screen.queryByTestId('inpPassphrase')).toBeInTheDocument()
    expect(screen.queryByTestId('inpPsbt')).toBeInTheDocument()
    expect(screen.queryByTestId('btnSign')).toBeInTheDocument()
  })

  it('doesnt render a sign page', () => {
    ctx.passphrase = 'some'
    renderer(<Sign />)
    expect(screen.queryByTestId('inpPassphrase')).not.toBeInTheDocument()
  })

  it('signs and saves PSBT', async () => {
    ctx.passphrase = ''
    const valid = {
      passphrase: 'password',
      psbt: 'valid psbt',
      signed: 'signed tx',
      signedPsbt: 'signed psbt'
    }
    // we'll not be testing the rust code here
    mockIPC((cmd, args) => {
      if (cmd === 'sign_psbt') {
        if (args.passphrase === valid.passphrase && args.psbt === valid.psbt) {
          return [valid.signed, valid.signedPsbt]
        } else Promise.reject(new Error('simulated err from rust'))
      }
    })
    renderer(<Sign />)

    ctx.passphrase = 'from other page'
    ctx.signed = 'from other page'

    const inpPassphrase = screen.queryByTestId('inpPassphrase')
    const inpPsbt = screen.queryByTestId('inpPsbt')
    fireEvent.change(inpPassphrase, {
      target: { value: valid.passphrase }
    })
    fireEvent.change(inpPsbt, { target: { value: valid.psbt } })

    ctx.passphrase = ''
    ctx.signed = ''

    fireEvent.change(inpPassphrase, {
      target: { value: valid.passphrase }
    })
    fireEvent.change(inpPsbt, { target: { value: valid.psbt } })
    const btnSign = screen.queryByTestId('btnSign')

    ctx.checkNet = false
    await actClicker(btnSign)
    await waitFor(() => {
      expect(btnSign).toHaveTextContent('sign-5')
      const { getByText } = within(screen.getByTestId('outQrCode'))
      expect(getByText(valid.signed)).toBeInTheDocument()
    })

    // behaviour when network is up
    await actClicker(btnSign)
    await waitFor(() => {
      expect(btnSign).toHaveTextContent('sign-6')
    })
    ctx.checkNet = true
    await actClicker(btnSign)
    await waitFor(() => {
      expect(btnSign).toHaveTextContent('sign-5')
    })

    // now for saves

    ctx.checkNet = false

    ctx.passphrase = 'foo'
    ctx.signed = 'bar'

    const btnSaveTx = screen.queryByTestId('btnSaveTx')
    expect(btnSaveTx).toBeInTheDocument()
    await actClicker(btnSaveTx)

    await waitFor(() => {
      expect(btnSaveTx).toHaveTextContent('sign-7')
    })
    const btnSavePsbt = screen.queryByTestId('btnSavePsbt')
    await actClicker(btnSavePsbt)
    await waitFor(() => {
      expect(btnSavePsbt).toHaveTextContent('sign-8')
    })
  })
})
