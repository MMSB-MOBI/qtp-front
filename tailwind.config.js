module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    backgroundColor: theme => ({
      ...theme('colors'),
      'light' : 'thistle'
    }),
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
