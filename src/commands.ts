import * as vscode from 'vscode';


export function mark_sequence_steps() {
    let activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage("Kein activer Editor gefunden.");
        return;
    }


    // let success = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', activeEditor.document.uri);

    activeEditor.edit(edit_builder => {
        let counter = 0;
        let sequence_stack = new Array();
        //makes typescript happy
        if (!activeEditor) {
            vscode.window.showErrorMessage("Kein activer Editor gefunden.");
            return;
        }
        let doc = activeEditor.document;
        //ignore first line
        for (let index = 1; index < doc.lineCount; index++) {
            const line = doc.lineAt(index);
            let buffer = line.text.toUpperCase().trim();
            //Push Sequence Instruction
            if (buffer.startsWith("SEQUENCE")) {
                sequence_stack.push(buffer.split(" ")[1].split(";")[0]);
                continue;
            }
            //Pop Sequence Instruction
            if (buffer.startsWith("END SEQUENCE")) {
                sequence_stack.pop();
            }
            if (buffer.startsWith("STEP")) {
                //syntax error! step without sequence!
                if (sequence_stack.length === 0) {
                    vscode.window.showErrorMessage("STEP ohne Sequence in Zeile + " + (index + 1) + "! Bitte Syntax überprüfen!");
                    return;
                }
                //get the step number
                let stepnumber = buffer.split(" ")[1].split(";")[0];
                //look if line before has proper comment
                let line_before = doc.lineAt(index - 1).text.toUpperCase().trim();
                if (!line_before.startsWith("/*") || (line_before.indexOf(stepnumber) === -1)) {
                    //insert proper step mark
                    let sequence_var = sequence_stack[sequence_stack.length - 1];
                    let comment = "/*" + "SEQ " + sequence_var + "---------------------------------------------" + stepnumber + "-*/;\n";
                    edit_builder.insert(new vscode.Position(index, 0), comment);
                    counter++;
                }



            }

        }
        vscode.window.showInformationMessage(counter + " Kommentare eingefügt.");
    });
}