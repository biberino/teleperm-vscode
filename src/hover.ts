import * as vscode from 'vscode';

/**
 * Parses the entire document into a map
 * @param document The Document
 * @returns map: Locale Variable -> Documentation
 */
export function parse_local_variables(document: vscode.TextDocument): Map<string, string> {

    let retVal = new Map<string, string>();

    for (let index = 0; index < document.lineCount; index++) {
        const line = document.lineAt(index);
        let buffer = line.text.toUpperCase().trim();
        if (buffer.startsWith("/*") && (buffer.indexOf("=") !== -1)) {
            buffer = buffer.replace("/*", "");
            buffer = buffer.replace("*/", "");
            let split = buffer.split("=");
            if (split.length === 2) {
                retVal.set(split[0].replace(/\s/g, ''), split[1].replace(";",""));
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
export function parse_local_variables_until_found(document: vscode.TextDocument, variable: string): string {
    let retVal: string = "Nicht dokumentiert!";

    for (let index = 0; index < document.lineCount; index++) {
        const line = document.lineAt(index);
        let buffer = line.text.toUpperCase().trim();
        if (buffer.startsWith("/*") && (buffer.indexOf("=") !== -1)) {
            buffer = buffer.replace("/*", "");
            buffer = buffer.replace("*/", "");
            let split = buffer.split("=");
            let variable_name = split[0].replace(/\s/g, '');
            if (split.length === 2 && variable_name === variable) {
                retVal = split[1].replace(";","");
                break;
            }
        }

    }

    return retVal;
}

/**
 * 
 * @param document The document
 * @param variable The global variable, eg GA123 or GB12
 * @param position The position of the cursor
 * @returns String representing the global variable name, eg GA.TEST
 */
export function find_latest_mux(document: vscode.TextDocument, variable: string, position: vscode.Position): string {

    const var_type: string = variable.substr(0, 2).toUpperCase();
    //regexp vor MUX XX.XXXX or MUX,XX,XXXX (.lay)
    const regex_mux = new RegExp("MUX(\\s|[,])(" + var_type + ")[,.]([A-Z]|[0-9]){1,4}");
    const regex_implicit_pointer_change = new RegExp("(" + var_type + ")[.]([A-Z]|[0-9]){1,4}[.][0-9]{1,3}");

    for (let current_line = position.line; current_line >= 0; current_line--) {
        const line = document.lineAt(current_line).text.trim().toUpperCase();
        if (regex_mux.test(line)) {
            return line;
        }
        if (regex_implicit_pointer_change.test(line)) {
            return line;
        }
    }
    return "Keinen aktiven Zeiger gefunden!";
}

export function hover_handler(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Hover {
    const range = document.getWordRangeAtPosition(position);
    const word = document.getText(range);
    const regex_local_variable = /((LA)|(LB))[0-9]{1,4}/;
    const regex_global_variable = /((GA)|(GB))[0-9]{1,4}/;
    if (range?.isSingleLine) {
        if (regex_local_variable.test(word)) {
            return new vscode.Hover(parse_local_variables_until_found(document, word));
        }

        if (regex_global_variable.test(word)) {
            return new vscode.Hover({ "language": "tml", "value": find_latest_mux(document, word, position) });
        }
    }


    return new vscode.Hover("");

}