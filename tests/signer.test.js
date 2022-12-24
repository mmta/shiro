import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/react'

import { renderer, mockedConfig, mockedi18next } from './mocks'
import Signer from '../src/pages/signer'

jest.mock('next/config', () => mockedConfig)
jest.mock('react-i18next', () => mockedi18next)

describe('Signer page', () => {
  it('renders a Signer page', () => {
    renderer(<Signer />)

    expect(screen.getByText('p-0-2')).toBeInTheDocument()
  })
})
