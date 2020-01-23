import * as vscode from 'vscode';

const teleperm_colors: string[] = [
    "schwarz",
    "rot",
    "grün",
    "blau",
    "gelb",
    "orange",
    "zyan",
    "weiß"
];

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
                retVal.set(split[0].replace(/\s/g, ''), split[1].replace(";", ""));
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
                retVal = split[1].replace(";", "");
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
    //regexp for MUX XX.XXXX or MUX,XX,XXXX (.lay)
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

/**
 * Maps a teleperm color triple (foreground,background,blinking) into a string
 * @param colors The array of colors, e.g 7,0,0
 */
function color_numbers_to_string(colors: number[]): string {
    const foreground = teleperm_colors[colors[0]];
    const background = teleperm_colors[colors[1]];
    const blinking = colors[2] === 0 ? "nicht blinkend" : "blinkend";
    
    return foreground + " auf " + background + ", " + blinking;
}

/**
 * Generates a Hover based on the Teleperm colorstring
 * @param teleperm_color The Teleperm colorstring, eg. "7:0:0,7:0:1"
 */
export function generate_color_hover(teleperm_color: string): vscode.Hover {
    const color_strings: string[] = teleperm_color.split(",");
    if (color_strings.length !== 2) {
        return new vscode.Hover("");
    }
    
    const color_options_1: number[] = color_strings[0].split(":").map(function (value: string) {
        return +value;
    });
    const color_options_2: number[] = color_strings[1].split(":").map(function (value: string) {
        return +value;
    });
    if (color_options_1.length !== color_options_2.length) {
        return new vscode.Hover("");
    }
    
    
    let buffer_color_1: string = color_numbers_to_string(color_options_1);
    let buffer_color_2: string = color_numbers_to_string(color_options_2);
    


    return new vscode.Hover(buffer_color_1 + " / " + buffer_color_2);


}

export function hover_handler(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Hover {
    const range = document.getWordRangeAtPosition(position);
    const word = document.getText(range);
    const line = document.lineAt(position);
    const line_trimmed = line.text.toUpperCase().trim();

    const regex_local_variable = /((LA)|(LB))[0-9]{1,4}/;
    const regex_global_variable = /((GA)|(GB))[0-9]{1,4}/;
    if (range?.isSingleLine) {
        if (regex_local_variable.test(word)) {
            return new vscode.Hover(parse_local_variables_until_found(document, word));
        }

        if (regex_global_variable.test(word)) {
            return new vscode.Hover({ "language": "tml", "value": find_latest_mux(document, word, position) });
        }

        if (line_trimmed.startsWith("MO")) {
            const bracket_open = line.text.indexOf("(");
            const bracket_close = line.text.indexOf(")");
            if (bracket_open !== -1 &&
                bracket_close !== -1 &&
                bracket_open < position.character &&
                bracket_close > position.character) {

                return generate_color_hover(line.text.substring(bracket_open + 1, bracket_close));

            }
        }
    }


    return new vscode.Hover("");

}