import * as vscode from 'vscode';




/**
 * 
 * @TODO get spaces per indentation from the editor settings
 * 
 */
const indent_per_level: number = 3;
const buffer: string[] = [
    "",
    "   ",
    "      ",
    "         ",
    "            ",
    "               ",
    "                  ",
    "                     ",
    "                        ",
    "                           ",
    "                              ",
    "                                 ",
    "                                    ",
    "                                       ",
    "                                          "
];

/**
 * Adds or removes whitespaces to match the desired indentation level
 * and turns the string to uppercase
 * 
 * @param line The line to indent
 * @param level The indentation level
 * @returns Changes to the Line
 */
export function set_indentation_level(line: vscode.TextLine, level: number): vscode.TextEdit {
    if (level > 13) {
        vscode.window.showErrorMessage("Mehr als 13 Einrücklevels werden nicht unterstützt. Bitte überprüfe deinen Code!");
    }

    let new_text = buffer[level] + line.text.substring(line.firstNonWhitespaceCharacterIndex).toUpperCase();
    return vscode.TextEdit.replace(line.range, new_text);
}