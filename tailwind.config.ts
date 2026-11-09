import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#627D98',
          500: '#486581',
          600: '#334E68',
          700: '#243B53',
          800: '#102A43',
          900: '#0B192C',
          950: '#070F1E',
        },
        brand: {
          primary: '#0B192C',
          accent: '#1E3E62',
          gold: '#F59E0B',
          goldHover: '#D97706',
          lightBg: '#F8FAFC',
        }
      },
    },
  },
  plugins: [],
};

export default config;
