import * as vscode from 'vscode';
import * as p from 'child_process';


let diagnosticCollection: vscode.DiagnosticCollection;




export function init(context: vscode.ExtensionContext) {

    diagnosticCollection = vscode.languages.createDiagnosticCollection('tml');
    context.subscriptions.push(diagnosticCollection);

}

export function check_syntax(document: vscode.TextDocument) {
    let uri = document.uri;
    diagnosticCollection.delete(uri);

    let options = vscode.workspace.getConfiguration("tml");
    if (!options.get("linterEnabled")) {
        return;
    }

    let linter = options.get("linterPath");
    if (linter === "") {
        vscode.window.showErrorMessage("Bitte in den Einstellungen den Pfad zum Linter angeben");
        return;
    }




    //checks if the file exists are done by the linter
    p.exec(linter + " " + uri.fsPath, (error, stdout, stderr) => {
        if (error) {

            if (error.code) {
                /* Command not found, configuration wrong */
                if (error.code > 5) {
                    return;
                }
                /* LINTER REPORTS: FILE NOT FOUND */
                if (error.code === 5) { return; }
            }
            else {
                return;
            }


            let buffer = stdout.trim().split("|");

            let lineNumber: number = parseInt(buffer[0]);
            let range = document.lineAt(lineNumber - 1).range;
            let msg: string = buffer[2].trim();


            /* map file --> diagnostics, in case we support checking multiple files */
            let diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();
            let diagnostics: vscode.Diagnostic[] = [];
            diagnostics.push(new vscode.Diagnostic(range, msg, vscode.DiagnosticSeverity.Error));

            diagnosticMap.set(uri.toString(), diagnostics);

            /*apply map */

            diagnosticMap.forEach((diags, file) => {
                diagnosticCollection.set(vscode.Uri.parse(file), diags);
            });

        }

    });

}

export function check_configuration(e: vscode.ConfigurationChangeEvent) {
    if (e.affectsConfiguration("tml")){
        let options = vscode.workspace.getConfiguration("tml");
        if (options.get("linterEnabled")) {
            let linter = options.get("linterPath");
            p.exec(linter + " --test", (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage("Linter Pfad nicht korrekt!");  
                    return;
                }
        
                if (stdout.startsWith("TEST")) {
                    vscode.window.showInformationMessage("Linter Pfad OK!");
                    return;
                }

                vscode.window.showErrorMessage("Linter Pfad nicht korrekt!"); 
            });
        }
    
    
    }
}