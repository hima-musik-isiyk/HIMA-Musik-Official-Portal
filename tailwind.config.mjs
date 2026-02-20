const config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./views/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf9f1',
          100: '#f5f0dd',
          200: '#ebdcae',
          300: '#dfc279',
          400: '#d4a64d',
          500: '#cb8e35',
          600: '#b1702a',
          700: '#8e5325',
          800: '#754325',
          900: '#643823',
          950: '#391c10',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      letterSpacing: {
        widest: '.25em',
      }
    },
  },
  plugins: [],
};

export default config;
