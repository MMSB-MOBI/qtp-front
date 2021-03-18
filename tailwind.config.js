module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    backgroundColor: theme => ({
      ...theme('colors'),
      'light' : 'thistle',
      'pannelSelection' : '#FDE68A'
    }),
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
