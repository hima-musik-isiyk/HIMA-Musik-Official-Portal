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
          50: '#fdf9ef',
          100: '#faf0d5',
          200: '#f5dda7',
          300: '#efc575',
          400: '#e5a63e',
          500: '#D4A64D',
          600: '#c08b2a',
          700: '#9c6c22',
          800: '#7e5520',
          900: '#68461e',
          950: '#3a240e',
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
