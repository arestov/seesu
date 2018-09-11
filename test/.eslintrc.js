module.exports = {
  "env": {
    "browser": true,
    "jest": true
  },
  "extends": "airbnb-base",
  "plugins": [
    "fp"
  ],
  "rules": {
    "camelcase": 0,
    "default-case": 0,
    "no-use-before-define": [1, {"functions": false}],
    "import/no-unresolved": 0,
    "import/extensions": 0,
    "arrow-parens": [
      "error", "as-needed"
    ],
    "no-confusing-arrow": 0,
    "no-shadow": 0,
    "no-underscore-dangle": 0,
    "semi": [
      1, "never"
    ],
    "import/no-extraneous-dependencies": 0,
    "import/prefer-default-export": 0,
    "import/no-duplicates": 0,
    "fp/no-delete": "error",
    "fp/no-get-set": "error",
    "fp/no-let": "error",
    "fp/no-loops": "error",
    "fp/no-mutating-assign": "error",
    "fp/no-mutating-methods": "error",
    "fp/no-mutation": [
      "error", {
        "commonjs": true,
        "allowThis": true,
        "exceptions": [
          {
            "object": "foo",
            "property": "bar"
          }
        ]
      }
    ],
    "fp/no-valueof-field": "error"
  }
}
