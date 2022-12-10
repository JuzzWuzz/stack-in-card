# LightEffect-Card by JuzzWuzz

Created using this page: <https://www.thisdot.co/blog/how-to-setup-a-typescript-project-using-rollup-js>

## Development

You can run the code locally by the `Serve` plugin using the `npm start` command. This will compile and serve the code so it can be loaded into a DevContainer or a real instance of Home Assistant.

To make use of DevContainers you'll need the `Dev Containers` extension and then to load the project in the Dev Container.

From there you'll need to start a terminal and execute: `container start`

Other commands:
init This will give you a fresh development environment.
run This will run the default action for the container you are using.
start This will start Home Assistant on port 9123.
check This will run Home Assistant config check.
set-version Install a specific version of Home Assistant.
upgrade Upgrade the installed Home Assistant version to the latest dev branch.
help Shows this help

## Cool things used

### Basics

1. Install a Typescript by running: `npm install --save-dev typescript`

2. Install Rollup and some core components by running: `npm install --save-dev rimraf rollup @babel/core`

   ```text
   Babel           <https://babeljs.io/>                                             A  JavaScript compiler
   Rollup          <https://rollupjs.org/>                                           Module bundler for JS applications to create libraries
   ```

3. Install Rollup plugins by running: `npm install --save-dev rollup-plugin-serve rollup-plugin-terser rollup-plugin-typescript2 @rollup/plugin-babel @rollup/plugin-commonjs @rollup/plugin-json @rollup/plugin-node-resolve`

   ```text
   Babel           <https://www.npmjs.com/package/@rollup/plugin-babel>              Allows to use Babel as part of rollup
   CommonJS        <https://www.npmjs.com/package/@rollup/plugin-commonjs>           Convert CommonJS modules to ES6
   JSON            <https://www.npmjs.com/package/@rollup/plugin-json>               A Rollup plugin which Converts .json files to ES6 modules.
   NodeResolve     <https://www.npmjs.com/package/@rollup/plugin-node-resolve>       Locates modules for rollup
   Serve           <https://www.npmjs.com/package/rollup-plugin-serve>               Allows for serving the folder
   Typescript2     <https://www.npmjs.com/package/rollup-plugin-typescript2>         Handles Typescript rollup with compilation errors
   Terser          <https://www.npmjs.com/package/rollup-plugin-terser>              Minifies Code
   ```

4. Add the basic config to the `rollup.config.js`

   ```js
   import commonjs from "@rollup/plugin-commonjs";
   import babel from "@rollup/plugin-babel";
   import json from "@rollup/plugin-json";
   import nodeResolve from "@rollup/plugin-node-resolve";
   import serve from "rollup-plugin-serve";
   import { terser } from "rollup-plugin-terser";
   import typescript from "rollup-plugin-typescript2";

   const dev = process.env.ROLLUP_WATCH;

   const serveopts = {
     contentBase: ["./dist"],
     host: "0.0.0.0",
     port: 5000,
     allowCrossOrigin: true,
     headers: {
       "Access-Control-Allow-Origin": "*",
     },
   };

   // The order is important!
   const plugins = [
     nodeResolve(),
     commonjs(),
     typescript(),
     json(),
     babel({
       exclude: "node_modules/**",
       babelHelpers: "bundled",
     }),
     dev && serve(serveopts),
     !dev &&
       terser({
         format: {
           comments: false,
         },
         mangle: {
           safari10: true,
         },
       }),
   ];

   export default {
     input: "src/lighteffect-card.ts",
     output: {
       dir: "dist",
       sourcemap: dev ? true : false,
     },
     plugins: [
       ...plugins,
     ],
     watch: {
       exclude: "node_modules/**",
       chokidar: {
         usePolling: true,
         paths: "src/**",
       },
     },
   };
   ```

### Prettier

<https://prettier.io/>
This is used for formatting of the code to ensure its nicely formatted

1. Intall Prettier by running: `npm install --save-dev prettier`

2. Install Prettier Rollup plugins by running: `npm install --save-dev prettier-plugin-multiline-arrays`

   ```text
   Multiline Array <https://www.npmjs.com/package/prettier-plugin-multiline-arrays>  Can make arrays format to new lines
   ```

3. Create a file named `.prettierrc.json` in the root of the project, with the following content

   ```json
   {
     "plugins": ["./node_modules/prettier-plugin-multiline-arrays"],
     "multilineArraysWrapThreshold": 1,
     "printWidth": 80,
     "tabWidth": 2,
     "useTabs": false,
     "singleQuote": false,
     "bracketSpacing": true,
     "trailingComma": "all"
   }
   ```

4. Create a file named `.prettierignore` in the root of the project, with the following content

   ```text
   dist
   node_modules
   ```

5. Setup the commands in `package.json`. Make sure you run it in the `build` before you do the rollup command

   ```json
   {
     "scripts": {
       "build": "... && npm run format && ...",
       "check": "... && npm run format:check && ...",
       "format": "prettier --write src/**/*.ts",
       "format:check": "prettier src/**/*.ts"
     }
   }
   ```

6. You can run prettier on all files (Readme included) using this command: `npx prettier --write .`

7. In order to run this easily in VS Code, install the `Prettier - Code formatter` extension

8. Open the command palette (CMD/CTRL + SHIFT + P) and type: `Preferences: Open Workspace Settings (JSON)`

9. Set the following options

   ```json
   {
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.formatOnPaste": false, // required
     "editor.formatOnType": false, // required
     "editor.formatOnSave": true, // optional
     "editor.formatOnSaveMode": "file", // required to format on save
     "files.autoSave": "onFocusChange" // optional but recommended
   }
   ```

10. Restart VS Code

### ESLint

<https://eslint.org/>
Used for finding linting problems

1. Intall ESLint by running: `npm install --save-dev --save-exact eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier`

2. Create a file named `.eslintrc.json` in the root of the project, with the following content

   ```json
   {
     "extends": [
       "eslint:recommended",
       "plugin:@typescript-eslint/recommended",
       "plugin:prettier/recommended"
     ],
     "parser": "@typescript-eslint/parser",
     "plugins": ["@typescript-eslint"],
     "parserOptions": {
       "ecmaVersion": 2018,
       "sourceType": "module",
       "experimentalDecorators": true
     },
     "rules": {
       "@typescript-eslint/indent": [
         "error",
         2
       ],
       "@typescript-eslint/no-explicit-any": "error",
       "@typescript-eslint/camelcase": 2,
       "no-console": 0
     },
     "ignorePatterns": [
       "dist/",
       "node_modules/",
       "rollup.config.js"
     ]
   }
   ```

3. Setup the commands in `package.json`. Make sure you run it in the `build` before you do the rollup command but after formatting

   ```json
   {
     "scripts": {
       "build": "... && npm run lint && ...",
       "check": "... && npm run lint:check && ...",
       "lint": "prettier --write src/**/*.ts",
       "lint:check": "prettier src/**/*.ts"
     }
   }
   ```

4. In order to run this easily in VS Code, install the `ESLint` extension

5. Restart VS Code

### Prettier & ESLint Compatability

1. In order to run this easily in VS Code, install the `Prettier ESLint` extension

2. Open the command palette (CMD/CTRL + SHIFT + P) and type: `Preferences: Open Workspace Settings (JSON)`

3. Set the following options

   ```json
   {
     "editor.defaultFormatter": "rvest.vs-code-prettier-eslint",
     "editor.formatOnPaste": false, // required
     "editor.formatOnType": false, // required
     "editor.formatOnSave": true, // optional
     "editor.formatOnSaveMode": "file", // required to format on save
     "files.autoSave": "onFocusChange" // optional but recommended
   }
   ```

4. You can now delete / disable the `Prettier - Code formatter` extension

5. Restart VS Code

### Serve

1. It is already included as part of the Rollup

2. Setup the commands in `package.json`. With the inclusion of the `--watch` flag changes made will immediately recompile and be made available

   ```json
   {
     "scripts": {
       "start": "rollup -c rollup.config.js --watch"
     }
   }
   ```

3. Run `npm start` to run the compile the code and server it. It can then be found at: `http://localhost:5000/lighteffect-card.js`

### Git

1. Run `git init` from the terminal

2. Create a file named `.gitignore` in the root of the project, with the following content

   ```text
   # Build Folders
   /dist/

   # Dependencies
   /node_modules/

   # OS metadata
   .DS_Store
   Thumbs.db
   ```

3. Create a new repository on GitHub

4. Link to the newly created repository: `git remote add origin https://github.com/JuzzWuzz/xxx.git`

5. Add the files you want: `git add xxx`

6. Commit your code: `git commit -m "Initial commit"`

7. Push you code: `git push -u origin master`
