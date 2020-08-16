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
      parser: "babel-eslint"
    },
    rules: {
      "no-undef": "off",
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off"
    }
  };
  