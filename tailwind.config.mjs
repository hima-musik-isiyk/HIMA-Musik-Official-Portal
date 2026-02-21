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
          50: '#fff4ed',
          100: '#ffe5d6',
          200: '#ffc7ad',
          300: '#ffa07a',
          400: '#ff7f45',
          500: '#ff6501',
          600: '#e25500',
          700: '#b74300',
          800: '#8f3500',
          900: '#742c00',
          950: '#3f1600',
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
