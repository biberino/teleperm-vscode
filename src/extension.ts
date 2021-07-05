// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as helper from './formatter-helpers';
import * as hover_handler from './hover';
import * as tml_symbol from './symbol-provider';
import * as tml_diagnostic from './diagnostic';
import * as tml_commands from './commands';



const indent_in: string[] = [
	"END IF",
	"END SEQUENCE",
	"END FOR",
	"ELSE",
	"ZE",
	"Z0",
	"STEP",
	"OUT",
	"END DO"
];

const indent_out: string[] = [
	"THEN",
	"SEQUENCE",
	"REPEAT",
	"ELSE",
	"Z1",
	"Z0",
	"STEP",
	"OUT",
	"DO"
];

export function activate(context: vscode.ExtensionContext) {

	/******** COMMANDS ********/
	let disposable = vscode.commands.registerCommand('tml.mark_steps', () => {
		tml_commands.mark_sequence_steps();
	});

	context.subscriptions.push(disposable);

	/******** HOVER PROVIDER ********/
	disposable = vscode.languages.registerHoverProvider('tml', {
		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
			return hover_handler.hover_handler(document, position, token);
		}
	});

	context.subscriptions.push(disposable);


	/******** FORMATTER ********/
	//TODO: move to own file
	disposable = vscode.languages.registerDocumentFormattingEditProvider('tml', {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			//@TODO use preallocated array of size document.lineCount
			let retVal: vscode.TextEdit[] = [];
			let level: number = 0;
			const empty_array: vscode.TextEdit[] = [];

			for (let index = 0; index < document.lineCount; index++) {
				const element = document.lineAt(index);
				if (element.isEmptyOrWhitespace) {
					continue;
				}
				const text_normalized = element.text.toUpperCase().trim();

				//check for indent_in first
				for (let i = 0; i < indent_in.length; i++) {
					if (text_normalized.startsWith(indent_in[i])) {
						level--;
						//sec check
						if (level < 0) {
							vscode.window.showErrorMessage("Einrückfehler: Einrücklevel ist negativ --> Zeile " + element.lineNumber);
							return empty_array;
						}
						break;
					}
				}
				//apply the indent level
				retVal.push(helper.set_indentation_level(element, level));

				//check for indent_out after
				for (let i = 0; i < indent_out.length; i++) {
					if (text_normalized.startsWith(indent_out[i])) {
						level++;
						break;
					}
				}

			}

			if (level !== 0) {
				vscode.window.showErrorMessage("Einrückfehler: Einrücklevel am Ende des Dokuments ist größer 0 (" + level + ")");
				return empty_array;
			}
			return retVal;
		}
	});
	context.subscriptions.push(disposable);

	/******** Symbol Provider (Outline) ********/
	context.subscriptions.push(
		vscode.languages.registerDocumentSymbolProvider(
			{ scheme: "file", language: "tml" },
			new tml_symbol.TMLDocumentSymbolProvider()
		)
	);

	/******** Diagnostics Support (Linter) ********/
	tml_diagnostic.init(context);
	vscode.workspace.onDidSaveTextDocument(tml_diagnostic.check_syntax);
	vscode.workspace.onDidChangeConfiguration(tml_diagnostic.check_configuration);

}


export function deactivate() { }
