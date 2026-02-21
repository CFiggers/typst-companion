# Typst Companion

A VS Code extension that adds Markdown-like editing niceties **on top of and in addition to** to an LSP extension like [tinymist](https://github.com/Myriad-Dreamin/tinymist).

## Features

- Intuitive handling of Ordered and Unordered lists in `.typ` files.
  - `Enter` while in a list context (either ordered or unordered) continues the existing list at the current level of indentation (with correct numbering, if ordered).
  - `Tab` and `Shift+Tab` while in a list context (either ordered or unordered) indents and out-dents bullets intuitively (and re-numbers ordered lists if appropriate).
  - Reordering lines inside an ordered list automatically updates the list numbers accordingly.
- Keyboard Shortcuts for:
  - Toggle Bold, Italics, and Underline (`ctrl/cmd + b|i|u`)
  - Toggle Highlight (`ctrl/cmd+h`) and Strikethrough (`ctrl/cmd+shift+u`)
  - Toggle Superscript (`ctrl/cmd+shift+=`) and Subscript (`ctrl/cmd+shift+-`)
  - Increase and decrease header level (`ctrl/cmd + shift + ]|[`)
  - Insert a page break (`ctrl/cmd + enter`, when not in a list context)

## Requirements

I *strongly* encourage installing [tinymist](https://github.com/Myriad-Dreamin/tinymist) in addition to this extension for syntax highlighting, error reporting, code completion, and all of tinymist LSP's other features. 
    This extension just adds some small additional features that I missed when using tinymist LSP.

## Release Notes

### 0.0.6 (2026-02-21)

- New keyboard shortcuts: Toggle Highlight, Toggle Strikethrough by @Qwekkeboom in #9
- New keyboard shortcuts: Toggle Superscript, Toggle Subscript by @Qwekkeboom in #10


For previous versions, see the [CHANGELOG on GitHub](https://github.com/CFiggers/typst-companion/blob/main/CHANGELOG.md).

## Prior Art

The core logic of this extension is adapted, with attribution and gratitude, from [Markdown All-in-One](https://github.com/yzhang-gh/vscode-markdown/), under the following license:

MIT License, Copyright (c) 2017 张宇
