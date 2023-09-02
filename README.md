# Typst Companion

A VS Code extension that adds Markdown-like editing niceties **on top of and in addition to** to Nathan Varner's [Typst LSP](https://github.com/nvarner/typst-lsp).

## Features

- Intuitive handling of Ordered and Unordered lists in `.typ` files.
  - `Enter` while in a list context (either ordered or unordered) continues the existing list at the current level of indentation (with correct numbering, if ordered).
  - `Tab` and `Shift+Tab` while in a list context (either ordered or unordered) indents and out-dents bullets intuitively (and re-numbers ordered lists if appropriate).
  - Reordering lines inside an ordered list automatically updates the list numbers accordingly.

## Requirements

I *strongly* encourage installing Nathan Varner's [Typst LSP](https://github.com/nvarner/typst-lsp) in addition to this extension for syntax highlighting, error reporting, code completion, and all of Typst LSP's other features. 
    This extension just adds some small additional features that I missed when using Typst LSP.

## Release Notes

### 0.0.1

Initial release of Typst Companion.

## Prior Art

The core logic of this extension is adapted, with attribution and gratitude, from [Markdown All-in-One](https://github.com/yzhang-gh/vscode-markdown/), under the following license:

MIT License, Copyright (c) 2017 张宇