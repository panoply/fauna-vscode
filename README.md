# FQL VSCode

This is the Fauna extension for VS Code. It allows users to write and run FQL queries against their database from the FQL Playground. This plugin provides intellisense with autocompletions tailored to your database when writing queries within the playground or any other .fql file.

To get started, simply configure the extension with your secret and press `cmd+l` (Mac) or `ctrl+l` (Linux/Windows) to open the FQL Playground! You can also use the VSCode command palette, `Fauna: Toggle Playground`.

## Configuration

To configure the extension, simply open up the extension configuration in VS Code and set your secret to the database you'd like to run queries against.

This can be configured globally across all VS Code instances, as well as at the Workspace level to allow for different databases per VS Code project.

## Running FQL Queries

To start writing and running FQL queries open the FQL Playground (`cmd+l` on Mac, `ctrl+l` on Linux/Windows) or `Fauna: Toggle Playground` from the VS Code command palette.

This command will toggle the playground, so if not active, it will open, and then when pressed again the playground will close. It will automatically save the content when the command is used to close it. Intellisense will be present as you begin typing queries into the playground.

To execute a query in the playground, use the `Run Query` button in the top right or press `cmd+enter` (Mac) or `ctrl+enter` Linx/Windows.

You can get all of the same functionality in `.fql` files that you open and save. This allows you to have any number of queries saved in your project that you can open and run.

## Run As Role

Running as role is currently available but only from the command palette. Look for `Fauna: Run Query As Role`. This will open up a quick pick section with your available roles to run from.
