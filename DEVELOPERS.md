## Developing the Extension

Open vscode in this directory, and hit F5 to run a new version of
vscode, which will have this plugin running.

Now in this new instance of vscode, press cmd+l/ctrl+l to open the FQL Playground.
This should have syntax highlighting, and a language server should give live
error messages.
This should also work in any files opened with a `.fql` extension

### Using a locally built analyzer/lsp

This won't always be necessary, but if you need to make changes to the language server/fql-analyzer and want to run your plugin with those changes you'll need to do the following:

First, compile the [fqlx-lsp](https://github.com/fauna/fqlx-lsp) repo, and have
that repository cloned next to this one. Once that is finished, run the
following commands:

```
yarn install
yarn compile
```

This will install dependencies, and compile the typescript code.

Once this is complete you'll need to update the debug options in the LanguageServer.ts file. There are comments in that file indicating what is needed to get this setup.
