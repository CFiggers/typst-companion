import * as vscode from 'vscode';
import { contextServiceManager } from "./editor-context-service/manager"
import * as listEditing from './listEditing';
import * as formatting from './format';

export function activate(context: vscode.ExtensionContext) {
	
    const typstLSP = vscode.extensions.getExtension('nvarner.typst-lsp');
    const tinymistLSP = vscode.extensions.getExtension('myriad-dreamin.tinymist');
    if(!typstLSP && !tinymistLSP){
        void vscode.window.showWarningMessage(
            'Typst Companion Says:\n\nHi there! This extension is designed to complement and accompany Nathan Varner\'s "Typst LSP" or Myriad Dreamin\'s "Tinymist Typst" extension. It doesn\'t look like you have that extension installed!\n\nYou probably want to go install Typst LSP or Tinymist Typst in addition to this one.',
            'Got it, thanks!'
        );
    }
    
    context.subscriptions.push(
        contextServiceManager
    );

	// Context services
    contextServiceManager.activate(context);
    
    // Override `Enter`, `Tab` and `Backspace` keys
    listEditing.activate(context);

    // Shortcuts
    formatting.activate(context);

}

export function deactivate() {}
