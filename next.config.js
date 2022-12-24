/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  publicRuntimeConfig: {
    i18n: {
      languages: ['en', 'id'],
      labels: ['English', 'Indonesian'],
      defaultLanguage: 'en',
      namespaces: [
        'common',
        'intro',
        'step1',
        'step2',
        'step3',
        'maintenance',
        'signer'
      ],
      defaultNamespace: 'common'
    }
  }
}

module.exports = nextConfig
