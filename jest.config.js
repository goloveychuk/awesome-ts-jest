
// const customTransformersPath = require.resolve('./webpack-config/ts_transformers.js')

module.exports = {
  "globals": {
  },
  "transform": {
    ".*": "<rootDir>/dist/preprocessor.js"
  },
  "testRegex": "tests/.*\\.test.ts$",
  "transformIgnorePatterns": [
    "<rootDir>/node_modules/(?!tsruntime)"
  ],
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json"
  ]
  
}