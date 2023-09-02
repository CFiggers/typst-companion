// From https://github.com/yzhang-gh/vscode-markdown/ , under the following license:
// 
// MIT License

// Copyright (c) 2017 张宇

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// 

'use strict';

import { commands, env, ExtensionContext, Position, Range, Selection, SnippetString, TextDocument, TextEditor, window, workspace, WorkspaceEdit } from 'vscode';
import { fixMarker } from './listEditing';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand('typst-companion.extension.editing.toggleBold', toggleBold),
        commands.registerCommand('typst-companion.extension.editing.toggleItalic', toggleItalic),
        commands.registerCommand('typst-companion.extension.editing.toggleUnderline', toggleUnderline),
        commands.registerCommand('typst-companion.extension.editing.toggleHeadingUp', toggleHeadingUp),
        commands.registerCommand('typst-companion.extension.editing.toggleHeadingDown', toggleHeadingDown),
        commands.registerCommand('typst-companion.extension.editing.toggleList', toggleList)
    );
}

function toggleItalic() {
    return styleByWrapping("_");
}

function toggleBold() {
    return styleByWrapping("*");
}

function toggleUnderline() {
    return styleByWrapping("#underline[", "]");
}

async function toggleHeadingUp() {
    const editor = window.activeTextEditor!;
    let lineIndex = editor.selection.active.line;
    let lineText = editor.document.lineAt(lineIndex).text;

    return await editor.edit((editBuilder) => {
        if (!lineText.startsWith('=')) { // Not a heading
            editBuilder.insert(new Position(lineIndex, 0), '= ');
        }
        else if (!lineText.startsWith('======')) { // Already a heading (but not level 6)
            editBuilder.insert(new Position(lineIndex, 0), '=');
        }
    });
}

function toggleHeadingDown() {
    const editor = window.activeTextEditor!;
    let lineIndex = editor.selection.active.line;
    let lineText = editor.document.lineAt(lineIndex).text;

    editor.edit((editBuilder) => {
        if (lineText.startsWith('= ')) { // Heading level 1
            editBuilder.delete(new Range(new Position(lineIndex, 0), new Position(lineIndex, 2)));
        }
        else if (lineText.startsWith('=')) { // Heading (but not level 1)
            editBuilder.delete(new Range(new Position(lineIndex, 0), new Position(lineIndex, 1)));
        }
    });
}

function toggleList() {
    const editor = window.activeTextEditor!;
    const doc = editor.document;
    let batchEdit = new WorkspaceEdit();

    for (const selection of editor.selections) {
        if (selection.isEmpty) {
            toggleListSingleLine(doc, selection.active.line, batchEdit);
        } else {
            for (let i = selection.start.line; i <= selection.end.line; i++) {
                toggleListSingleLine(doc, i, batchEdit);
            }
        }
    }

    return workspace.applyEdit(batchEdit).then(() => fixMarker(editor));
}

function toggleListSingleLine(doc: TextDocument, line: number, wsEdit: WorkspaceEdit) {
    const lineText = doc.lineAt(line).text;
    const indentation = lineText.trim().length === 0 ? lineText.length : lineText.indexOf(lineText.trim());
    const lineTextContent = lineText.slice(indentation);
    const currentMarker = getCurrentListStart(lineTextContent);
    const nextMarker = getNextListStart(currentMarker);

    // 1. delete current list marker
    wsEdit.delete(doc.uri, new Range(line, indentation, line, getMarkerEndCharacter(currentMarker, lineText)));

    // 2. insert next list marker
    if (nextMarker !== ListMarker.EMPTY)
        wsEdit.insert(doc.uri, new Position(line, indentation), nextMarker);
}

/**
 * List candidate markers enum
 */
enum ListMarker {
    EMPTY = "",
    DASH = "- ",
    STAR = "* ",
    PLUS = "+ ",
    NUM = "1. ",
    NUM_CLOSING_PARETHESES = "1) "
}

function getListMarker(listMarker: string): ListMarker {
    if ("- " === listMarker) {
        return ListMarker.DASH;
    } else if  ("* " === listMarker) {
        return ListMarker.STAR;
    }  else if  ("+ " === listMarker) {
        return ListMarker.PLUS;
    }  else if  ("1. " === listMarker) {
        return ListMarker.NUM;
    } else if ("1) " === listMarker) {
        return ListMarker.NUM_CLOSING_PARETHESES;
    } else {
        return ListMarker.EMPTY;
    }
}

const listMarkerSimpleListStart = [ListMarker.DASH, ListMarker.STAR, ListMarker.PLUS]
const listMarkerDefaultMarkerArray = [ListMarker.DASH, ListMarker.STAR, ListMarker.PLUS, ListMarker.NUM, ListMarker.NUM_CLOSING_PARETHESES]
const listMarkerNumRegex = /^\d+\. /;
const listMarkerNumClosingParethesesRegex = /^\d+\) /;
    
function getMarkerEndCharacter(currentMarker: ListMarker, lineText: string): number {
    const indentation = lineText.trim().length === 0 ? lineText.length : lineText.indexOf(lineText.trim());
    const lineTextContent = lineText.slice(indentation);
    
    let endCharacter = indentation;
    if (listMarkerSimpleListStart.includes(currentMarker)) {
        // `- `, `* `, `+ `
        endCharacter += 2;
    } else if (listMarkerNumRegex.test(lineTextContent)) {
        // number
        const lenOfDigits = /^(\d+)\./.exec(lineText.trim())![1].length;
        endCharacter += lenOfDigits + 2;
    } else if (listMarkerNumClosingParethesesRegex.test(lineTextContent)) {
        // number with )
        const lenOfDigits = /^(\d+)\)/.exec(lineText.trim())![1].length;
        endCharacter += lenOfDigits + 2;
    }
    return endCharacter;
}

/**
 * get list start marker
 */
function getCurrentListStart(lineTextContent: string): ListMarker {
    if (lineTextContent.startsWith(ListMarker.DASH)) {
        return ListMarker.DASH;
    } else if (lineTextContent.startsWith(ListMarker.STAR)) {
        return ListMarker.STAR;
    } else if (lineTextContent.startsWith(ListMarker.PLUS)) {
        return ListMarker.PLUS;
    } else if (listMarkerNumRegex.test(lineTextContent)) {
        return ListMarker.NUM;
    } else if (listMarkerNumClosingParethesesRegex.test(lineTextContent)) {
        return ListMarker.NUM_CLOSING_PARETHESES;
    } else {
        return ListMarker.EMPTY;
    }
}

/**
 * get next candidate marker from configArray
 */
function getNextListStart(current: ListMarker): ListMarker {
    const configArray = getCandidateMarkers();
    let next = configArray[0];
    const index = configArray.indexOf(current);
    if (index >= 0 && index < configArray.length - 1)
        next = configArray[index + 1];
    return next;
}

/**
 * get candidate markers array from configuration 
 */
function getCandidateMarkers(): ListMarker[] {
    // read configArray from configuration and append space
    let configArray = workspace.getConfiguration('typst-companion.extension.list.toggle').get<string[]>('candidate-markers');
    if (!(configArray instanceof Array))
        return listMarkerDefaultMarkerArray;
    
    // append a space after trim, markers must end with a space and remove unknown markers
    let listMarkerArray = configArray.map((e) => getListMarker(e + " ")).filter((e) => listMarkerDefaultMarkerArray.includes(e));
    // push empty in the configArray for init status without list marker
    listMarkerArray.push(ListMarker.EMPTY);

    return listMarkerArray;
}

// Read PR #1052 before touching this please!
function styleByWrapping(startPattern: string, endPattern = startPattern) {
    const editor = window.activeTextEditor!;
    let selections = editor.selections;

    let batchEdit = new WorkspaceEdit();
    let shifts: [Position, number][] = [];
    let newSelections: Selection[] = selections.slice();

    for (const [i, selection] of selections.entries()) {

        let cursorPos = selection.active;
        const shift = shifts.map(([pos, s]) => (selection.start.line == pos.line && selection.start.character >= pos.character) ? s : 0)
            .reduce((a, b) => a + b, 0);

        if (selection.isEmpty) {
            const context = getContext(editor, cursorPos, startPattern, endPattern);

            // No selected text
            if (
                startPattern === endPattern &&
                ["**", "*", "__", "_"].includes(startPattern) &&
                context === `${startPattern}text|${endPattern}`
            ) {
                // `**text|**` to `**text**|`
                let newCursorPos = cursorPos.with({ character: cursorPos.character + shift + endPattern.length });
                newSelections[i] = new Selection(newCursorPos, newCursorPos);
                continue;
            } else if (context === `${startPattern}|${endPattern}`) {
                // `**|**` to `|`
                let start = cursorPos.with({ character: cursorPos.character - startPattern.length });
                let end = cursorPos.with({ character: cursorPos.character + endPattern.length });
                wrapRange(editor, batchEdit, shifts, newSelections, i, shift, cursorPos, new Range(start, end), false, startPattern, endPattern);
            } else {
                // Select word under cursor
                let wordRange = editor.document.getWordRangeAtPosition(cursorPos);
                if (wordRange == undefined) {
                    wordRange = selection;
                }
                // One special case: toggle strikethrough in task list
                const currentTextLine = editor.document.lineAt(cursorPos.line);
                if (startPattern === '~~' && /^\s*[\*\+\-] (\[[ x]\] )? */g.test(currentTextLine.text)) {
                    wordRange = currentTextLine.range.with(new Position(cursorPos.line, currentTextLine.text.match(/^\s*[\*\+\-] (\[[ x]\] )? */g)![0].length));
                }
                wrapRange(editor, batchEdit, shifts, newSelections, i, shift, cursorPos, wordRange, false, startPattern, endPattern);
            }
        } else {
            // Text selected
            wrapRange(editor, batchEdit, shifts, newSelections, i, shift, cursorPos, selection, true, startPattern, endPattern);
        }
    }

    return workspace.applyEdit(batchEdit).then(() => {
        editor.selections = newSelections;
    });
}

/**
 * Add or remove `startPattern`/`endPattern` according to the context
 * @param editor
 * @param options The undo/redo behavior
 * @param cursor cursor position
 * @param range range to be replaced
 * @param isSelected is this range selected
 * @param startPtn
 * @param endPtn
 */
function wrapRange(editor: TextEditor, wsEdit: WorkspaceEdit, shifts: [Position, number][], newSelections: Selection[], i: number, shift: number, cursor: Position, range: Range, isSelected: boolean, startPtn: string, endPtn: string) {
    let text = editor.document.getText(range);
    const prevSelection = newSelections[i];
    const ptnLength = (startPtn + endPtn).length;

    let newCursorPos = cursor.with({ character: cursor.character + shift });
    let newSelection: Selection;
    if (isWrapped(text, startPtn, endPtn)) {
        // remove start/end patterns from range
        wsEdit.replace(editor.document.uri, range, text.substr(startPtn.length, text.length - ptnLength));

        shifts.push([range.end, -ptnLength]);

        // Fix cursor position
        if (!isSelected) {
            if (!range.isEmpty) { // means quick styling
                if (cursor.character == range.end.character) {
                    newCursorPos = cursor.with({ character: cursor.character + shift - ptnLength });
                } else {
                    newCursorPos = cursor.with({ character: cursor.character + shift - startPtn.length });
                }
            } else { // means `**|**` -> `|`
                newCursorPos = cursor.with({ character: cursor.character + shift + startPtn.length });
            }
            newSelection = new Selection(newCursorPos, newCursorPos);
        } else {
            newSelection = new Selection(
                prevSelection.start.with({ character: prevSelection.start.character + shift }),
                prevSelection.end.with({ character: prevSelection.end.character + shift - ptnLength })
            );
        }
    } else {
        // add start/end patterns around range
        wsEdit.replace(editor.document.uri, range, startPtn + text + endPtn);

        shifts.push([range.end, ptnLength]);

        // Fix cursor position
        if (!isSelected) {
            if (!range.isEmpty) { // means quick styling
                if (cursor.character == range.end.character) {
                    newCursorPos = cursor.with({ character: cursor.character + shift + ptnLength });
                } else {
                    newCursorPos = cursor.with({ character: cursor.character + shift + startPtn.length });
                }
            } else { // means `|` -> `**|**`
                newCursorPos = cursor.with({ character: cursor.character + shift + startPtn.length });
            }
            newSelection = new Selection(newCursorPos, newCursorPos);
        } else {
            newSelection = new Selection(
                prevSelection.start.with({ character: prevSelection.start.character + shift }),
                prevSelection.end.with({ character: prevSelection.end.character + shift + ptnLength })
            );
        }
    }

    newSelections[i] = newSelection;
}

function isWrapped(text: string, startPattern: string, endPattern: string): boolean {
    return text.startsWith(startPattern) && text.endsWith(endPattern);
}

function getContext(editor: TextEditor, cursorPos: Position, startPattern: string, endPattern: string): string {
    let startPositionCharacter = cursorPos.character - startPattern.length;
    let endPositionCharacter = cursorPos.character + endPattern.length;

    if (startPositionCharacter < 0) {
        startPositionCharacter = 0;
    }

    let leftText = editor.document.getText(new Range(cursorPos.line, startPositionCharacter, cursorPos.line, cursorPos.character));
    let rightText = editor.document.getText(new Range(cursorPos.line, cursorPos.character, cursorPos.line, endPositionCharacter));

    if (rightText == endPattern) {
        if (leftText == startPattern) {
            return `${startPattern}|${endPattern}`;
        } else {
            return `${startPattern}text|${endPattern}`;
        }
    }
    return '|';
}