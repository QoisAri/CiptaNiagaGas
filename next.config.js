/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tambahkan blok 'images' ini
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lyyttxtfffyzfcifcldf.supabase.co', // Hostname dari URL Supabase Anda
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

module.exports = nextConfig;