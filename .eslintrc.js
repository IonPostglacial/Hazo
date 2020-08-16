module.exports = {
  root: true,

  env: {
    node: true
  },

  extends: ["plugin:vue/essential", "eslint:recommended"],

  // parser: "@typescript-eslint/parser",
  plugins: [
    "eslint-plugin-vue",
    "@typescript-eslint",
  ],

  parserOptions: {
    parser: '@typescript-eslint/parser'
  },

  rules: {
    "no-undef": "off",
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off"
  },

  'extends': [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript'
  ]
};
  
