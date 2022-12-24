import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockIPC } from '@tauri-apps/api/mocks'
import { ctx, mockedi18next, renderer } from './mocks'
import Step1 from '../src/pages/step1'
import { sleep } from '../src/components/util'

jest.mock('react-i18next', () => mockedi18next)

describe('Step1 page', () => {
  it('renders an Step1 page', async () => {
    renderer(<Step1 />)
    // just get the first and last one
    expect(screen.getByText('p-0-2')).toBeInTheDocument()
    expect(screen.getByText('p-7-2')).toBeInTheDocument()
  })

  const valid = {
    passphrase: undefined,
    mnemonic: 'bar',
    password: 'car'
  }

  const actClicker = async el => {
    await act(async () => {
      el.click()
      await sleep(50)
    })
  }

  it('processes inputs correctly', async () => {
    renderer(<Step1 />)

    ctx.checkNet = true

    mockIPC((cmd, args) => {
      if (cmd === 'decrypt_and_get_addresses') {
        if (args.passphrase === valid.passphrase) {
          return ['pub', 'addr']
        } else Promise.reject(new Error('simulated err from rust'))
      }
      if (cmd === 'recovery_file_exist') {
        return [true, 'file']
      }
      if (cmd === 'generate_mnemonic') {
        return valid.mnemonic
      }
      if (cmd === 'generate_password') {
        return valid.password
      }
      if (cmd === 'generate_passphrase') {
        return valid.passphrase
      }
    })

    const inpMnemonic = screen.queryByTestId('inpMnemonic')
    await userEvent.type(inpMnemonic, 'foo')

    const btnMnemonic = screen.queryByTestId('btnMnemonic')
    await actClicker(btnMnemonic)

    const inpBipPassphrase = screen.queryByTestId('inpBipPassphrase')
    await userEvent.type(inpBipPassphrase, 'foo')

    const btnBipPassphrase = screen.queryByTestId('btnBipPassphrase')
    await actClicker(btnBipPassphrase)
    expect(screen.getByDisplayValue(valid.password)).toBeVisible()

    const inpPassphrase = screen.queryByTestId('inpPassphrase')
    await userEvent.type(inpPassphrase, 'foo')

    const btnPassphrase = screen.queryByTestId('btnPassphrase')
    valid.passphrase = 'foobar'
    await actClicker(btnPassphrase)
    expect(screen.getByDisplayValue(valid.passphrase)).toBeVisible()

    const btnEncrypt = screen.queryByTestId('btnEncrypt')
    await actClicker(btnEncrypt)
    const btnDecrypt = screen.queryByTestId('btnDecrypt')
    await waitFor(() => {
      expect(btnDecrypt).toBeEnabled()
    })

    await actClicker(btnDecrypt)
    const btnExplore = screen.queryByTestId('btnExplore')
    await actClicker(btnExplore)
    const btnConfirmBackup = screen.queryByTestId('btnConfirmBackup')
    await actClicker(btnConfirmBackup)
    await waitFor(() => {
      expect(btnDecrypt).toBeDisabled()
    })
  })
})
