// eslint.config.js
// Robust & DRY ESLint Flat Config for ES5 client assets and Node.js tools

// Shared Browser and Userscript globals
const clientGlobals = {
  window: "readonly",
  document: "readonly",
  console: "readonly",
  fetch: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  alert: "readonly",
  location: "readonly",
  btoa: "readonly",
  atob: "readonly",
  unescape: "readonly",
  encodeURIComponent: "readonly",
  decodeURIComponent: "readonly",
  Uint8Array: "readonly",
  Uint32Array: "readonly",
  Int32Array: "readonly",
  DataView: "readonly",
  ArrayBuffer: "readonly",
  Blob: "readonly",
  URL: "readonly",
  HTMLElement: "readonly",
  setImmediate: "readonly",

  // Userscripts API Globals
  GM_xmlhttpRequest: "readonly",
  GM_download: "readonly",
  GM_addStyle: "readonly",

  // Application Specific Namespaces
  isMock: "writable",
  CurrentUser: "writable",
  Services: "writable",
  Utils: "writable",
  API: "writable",
  UI: "writable"
};

// Shared baseline browser rules
const clientRules = {
  // Possible Errors & Logical bugs
  "no-cond-assign": "error",
  "no-constant-condition": ["error", { "checkLoops": false }],
  "no-dupe-args": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-empty": ["error", { "allowEmptyCatch": true }],
  "no-func-assign": "error",
  "no-inner-declarations": "error",
  "no-invalid-regexp": "error",
  "no-irregular-whitespace": "error",
  "no-obj-calls": "error",
  "no-sparse-arrays": "error",
  "no-unexpected-multiline": "error",
  "no-unreachable": "error",
  "no-unsafe-finally": "error",
  "no-unsafe-negation": "error",
  "use-isnan": "error",
  "valid-typeof": "error",

  // Best Practices & Scope Safety
  "no-case-declarations": "error",
  "no-empty-pattern": "error",
  "no-fallthrough": "error",
  "no-global-assign": "error",
  "no-octal": "error",
  "no-self-assign": "error",
  "no-unused-labels": "error",
  "no-with": "error",

  // Variable Declarations & References
  "no-delete-var": "error",
  "no-shadow-restricted-names": "error",
  "no-use-before-define": ["error", { "functions": false, "classes": true, "variables": false }]
};

module.exports = [
  // Global ignores list to exclude linter configurations from ES5 parsing checks
  {
    ignores: ["eslint.config.js"]
  },
  // 1. Client Source Code (src/) - Check draft code safety (redeclares check within files)
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: "script",
      globals: clientGlobals
    },
    rules: {
      ...clientRules,
      "no-redeclare": "error", // Catch duplicate declarations inside the same file
      "no-undef": "off",        // Silence crossed-file globals undef warnings (checked in bundle!)
      "no-unused-vars": "off"   // Ignore split-script unused variables (checked in bundle!)
    }
  },
  // 2. Compiled Userscript Bundle (dist/) - Check compilation safety (asserts no undefined references)
  {
    files: ["dist/*.js"],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: "script",
      globals: clientGlobals
    },
    rules: {
      ...clientRules,
      "no-redeclare": "off",   // Ignore expected variables mergers in compiled bundle
      "no-undef": "error",     // STRICT: Ensure all references are defined in final bundle!
      "no-unused-vars": ["warn", { "vars": "all", "args": "none", "caughtErrors": "none" }]
    }
  },
  // 3. Node Build, Mock & Test Scripts - Allowed Node.js environment globals (ES5 compliance)
  {
    files: ["*.js", "tests/*.js", "mock/*.js"],
    languageOptions: {
      ecmaVersion: 5,
      sourceType: "commonjs",
      globals: {
        global: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        Uint8Array: "readonly",
        ArrayBuffer: "readonly",
        DataView: "readonly",

        // Add application namespace globals whitelisted inside test/cli wrappers
        window: "readonly",
        Services: "readonly",
        Utils: "readonly",
        API: "readonly",
        UI: "readonly",
        test: "readonly",
        isProxy: "readonly"
      }
    },
    rules: {
      "no-undef": "error"
    }
  }
];
