# FQLX VsCode

This is a vscode plugin for FQLX. I'm not sure how to export plugins, so for now
just open up vscode in this project, and hit `F5` to open a second instance of
vscode, which will have this plugin running.

This also needs to be updated with the typescript template stuff, such as husky
and fixes to the scripts in `package.json`. This is a very hacky repo! It is
just a proof of concept for syntax highlighting and a language server.

### To Compile

First, compile the [fqlx-lsp](https://github.com/fauna/fqlx-lsp) repo, and have
that repository cloned next to this one. Once that is finished, run the
following commands:
```
yarn install
yarn compile
```

This will install dependencies, and compile the typescript code.

Finally, open vscode in this directory, and hit F5 to run a new version of
vscode, which will have this plugin running.

Now in this new instance of vscode, create a file with the `.fqlx` extension.
This should have syntax highlighting, and a language server should give live
error messages.
