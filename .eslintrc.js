module.exports = {
  extends: ['@loopback/eslint-config', 'plugin:cypress/recommended'],
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-misused-promises': 'off'
      },
    }
  ],
  rules: {
    'mocha/handle-done-callback': 'off',
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"]
      },
      {
        "selector": "objectLiteralProperty",
        "format": ["camelCase", "UPPER_CASE", "snake_case"]
      }
    ]
  },
  parserOptions: {
    createDefaultProgram: true,
  },
};
