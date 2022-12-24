import { Html, Head, Main, NextScript } from 'next/document'

export default function Document () {
  return (
    <Html className='has-navbar-fixed-top'>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
