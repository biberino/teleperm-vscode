import * as vscode from 'vscode';

export class TMLDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> {
        return new Promise((resolve, reject) => {

            let symbols: vscode.DocumentSymbol[] = [];
            let active_parents: vscode.DocumentSymbol[] = [];

            for (let index = 0; index < document.lineCount; index++) {
                const line = document.lineAt(index);
                const line_formatted = line.text.trim().toUpperCase();

                if (line_formatted.startsWith("SEQUENCE")) {
                    let buffer = new vscode.DocumentSymbol(line_formatted.substring(0, line_formatted.length - 1),
                        "Schrittanweisung",
                        vscode.SymbolKind.Enum,
                        line.range,
                        line.range);
                    if (active_parents.length > 0) {
                        active_parents[active_parents.length - 1].children.push(buffer);
                    } else {
                        symbols.push(buffer);
                    }
                    active_parents.push(buffer);
                }
                else if (line_formatted.startsWith("STEP")) {

                    //pop previous step instruction if neccassary
                    if (active_parents.length > 0) {
                        if (active_parents[active_parents.length - 1].detail === "Unterschritt") {
                            active_parents.pop();
                        }
                    }
                    let buffer = new vscode.DocumentSymbol(line_formatted.substring(0, line_formatted.length - 1),
                        "Unterschritt",
                        vscode.SymbolKind.EnumMember,
                        line.range,
                        line.range);
                    if (active_parents.length > 0) {
                        active_parents[active_parents.length - 1].children.push(buffer);
                    } else {
                        symbols.push(buffer);
                    }
                    active_parents.push(buffer);

                }
                else if (line_formatted.startsWith("END SEQUENCE")) {
                    //pop all until sequence
                    do {
                    }
                    while (active_parents.pop()?.detail !== "Schrittanweisung");
                }
                else if (line_formatted.startsWith("ROUTINE")) {
                    let buffer = new vscode.DocumentSymbol(line_formatted.substring(0, line_formatted.length - 1),
                        "Routine",
                        vscode.SymbolKind.Function,
                        line.range,
                        line.range);
                    if (active_parents.length > 0) {
                        active_parents[active_parents.length - 1].children.push(buffer);
                    } else {
                        symbols.push(buffer);
                    }
                    active_parents.push(buffer);
                }
                else if (line_formatted.startsWith("END ROUTINE")) {
                    //pop all until routine
                    do {
                    }
                    while (active_parents.pop()?.detail !== "Routine");
                }
                else if (line_formatted.startsWith("CALL")) {
                    let buffer = new vscode.DocumentSymbol(line_formatted.substring(0, line_formatted.length - 1),
                        "Funktionsaufruf",
                        vscode.SymbolKind.Method,
                        line.range,
                        line.range);
                    if (active_parents.length > 0) {
                        active_parents[active_parents.length - 1].children.push(buffer);
                    } else {
                        symbols.push(buffer);
                    }
                }

            }

            resolve(symbols);
        });
    }
}