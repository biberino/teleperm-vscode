import * as vscode from 'vscode';

/**
 * Parses the entire document into a map
 * @param document The Document
 * @returns map: Locale Variable -> Documentation
 */
export function parse_document(document: vscode.TextDocument): Map<string,string> {

    let retVal = new Map<string, string>();

    for (let index = 0; index < document.lineCount; index++) {
        const line = document.lineAt(index);
        let buffer = line.text.toUpperCase().trim();
        if (buffer.startsWith("/*") && (buffer.indexOf("=")!== -1)) {
            buffer = buffer.replace("/*", "");
            buffer = buffer.replace("*/", "");
            let split = buffer.split("=");
            if (split.length === 2) {
                retVal.set(split[0].replace(/\s/g,''), split[1]);
            }
        }
        
    }

    return retVal;
    
}

/**
 * Parses the document until the local variable is found
 * @param document The document
 * @param variable The local variable, e.g LA1
 * @returns string: The documentation for the given variable, "Nicht dokumentiert" if undocumented
 */
export function parse_document_until_found(document: vscode.TextDocument, variable: string): string {
    let retVal: string = "Nicht dokumentiert!";

    for (let index = 0; index < document.lineCount; index++) {
        const line = document.lineAt(index);
        let buffer = line.text.toUpperCase().trim();
        if (buffer.startsWith("/*") && (buffer.indexOf("=")!== -1)) {
            buffer = buffer.replace("/*", "");
            buffer = buffer.replace("*/", "");
            let split = buffer.split("=");
            let variable_name = split[0].replace(/\s/g, '');
            if (split.length === 2 && variable_name === variable) {
                retVal = split[1];
                break;
            }
        }
        
    }

    return retVal;
}

export function hover_handler(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Hover {
    const range = document.getWordRangeAtPosition(position);
    const word = document.getText(range);
    const regex = /((LA)|(LB))[0-9]{1,4}/;
    if (range?.isSingleLine && regex.test(word)) {
        return new vscode.Hover(parse_document_until_found(document, word));
    }

    return new vscode.Hover("");

}