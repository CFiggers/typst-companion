import * as vscode from 'vscode';
import { contextServiceManager } from "./editor-context-service/manager"
import * as listEditing from './listEditing';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
        contextServiceManager
    );

	// Context services
    contextServiceManager.activate(context);
    
    // Override `Enter`, `Tab` and `Backspace` keys
    listEditing.activate(context);

}

export function deactivate() {}
