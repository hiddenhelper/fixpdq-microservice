module.exports = {
  extends: ["airbnb", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
  },
  rules: {
    indent: ["error", 2],
    "import/prefer-default-export": [0],
    quotes: ["error", "double"],
    "no-console": "off",
  },
};
