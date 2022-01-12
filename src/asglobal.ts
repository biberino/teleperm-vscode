

import fs = require('fs');
import * as path from 'path';
import * as vscode from 'vscode';
import moment = require('moment');
import { DBFFile } from 'dbffile';
import { parse } from 'csv-parse/sync';


let latest_asglobal_folder_global: string = "";

export function get_latest_asglobal_folder(asglobal_export_path: string): string {

    let latest_folder: string = "";
    let latest_date: moment.Moment;
    if (!fs.existsSync(asglobal_export_path)) {
        latest_asglobal_folder_global = "";
        return "ASGlobal Ordner existiert nicht. Überprüfe deine Einstellungen";
    }
    fs.readdirSync(asglobal_export_path).forEach(file => {
        let m = parse_date_from_folder(file);
        if (m.isValid()) {
            if (latest_folder === "") {
                latest_folder = file;
                latest_date = m;
            } else {
                if (m.isAfter(latest_date)) {
                    latest_folder = file;
                    latest_date = m;
                }
            }
        }

    });

    latest_asglobal_folder_global = latest_folder;

    return "";

}



export function init() {

    let options = vscode.workspace.getConfiguration("tml");
    if (!options.get("asglobalEnabled")) {
        return;
    }

    const asglobal_path = options.get<string>("asglobalBasePath");
    if (asglobal_path === undefined) {
        return;
    }
    const error = get_latest_asglobal_folder(asglobal_path);
    if (error === "") {
        if (latest_asglobal_folder_global === "") {
            vscode.window.showErrorMessage("Es konnte kein passender AS Global Unterordner ermittelt werden");
        } else {
            vscode.window.showInformationMessage("Aktuellster AS Global Stand: " + latest_asglobal_folder_global);
        }
    } else {
        vscode.window.showErrorMessage(error);
    }

}
/**
 * 
 * @param AS Die AS, zum Beispiel 39
 * @param tml_string Der Teleperm String, zum Beispiel "GB.ERNT.25"
 */
export async function get_dokumentation(AS: number, tml_string: string): Promise<string> {
    let options = vscode.workspace.getConfiguration("tml");
    if (!options.get("asglobalEnabled")) {
        return "";
    }

    if (latest_asglobal_folder_global === "") {
        return "";
    }

    const asglobal_path = options.get<string>("asglobalBasePath");
    if (asglobal_path === undefined) {
        return "";
    }
    let split = tml_string.split('.');
    let element_number = split[2];
    //TODO: normalize path
    let AS_string = AS.toString();
    if (AS < 10) {
        AS_string = "0" + AS_string;
    }
    const filepath_dbase = asglobal_path + "/" + latest_asglobal_folder_global + "/AS_" + AS_string + "/" + split[0] + "/" + split[1] + ".DBF";
    const filepath_csv = asglobal_path + "/" + latest_asglobal_folder_global + "/AS_" + AS_string + "/" + split[0] + "/" + split[1] + ".CSV";

    //CSV auslesen
    if (fs.existsSync(filepath_csv)) {
        return get_documentation_from_csv(filepath_csv, element_number);
    }


    //DBASE auslesen  
    if (fs.existsSync(filepath_dbase)) {

        let dbf = await DBFFile.open(filepath_dbase);
        //TODO: hier optimieren
        let records = await dbf.readRecords(255);
        for (let record of records) {
            if (record["ELNR"] === parseInt(element_number)) {
                return typeof record["KOMMENTAR"] === 'string' ? record["KOMMENTAR"] : "";
            }
        }
        return "";
    }

    //weder CSV noch DBASE vorhanden
    return "";
}

export function find_asglobal_info(document: vscode.TextDocument): number {
    let options = vscode.workspace.getConfiguration("tml");
    if (!options.get("asglobalEnabled")) {
        return -1;
    }

    for (let index = 0; index < document.lineCount; index++) {
        const line = document.lineAt(index);
        let buffer = line.text.toUpperCase().trim();
        if (buffer.startsWith("/*") && (buffer.indexOf("=") !== -1) && (buffer.indexOf("ASGLOBAL") !== -1)) {
            buffer = buffer.replace("/*", "");
            buffer = buffer.replace("*/", "");
            buffer = buffer.replace(";", "");
            buffer = buffer.replace(/\s/g, '');
            let split = buffer.split("=");

            if ((split.length === 2) && (split[1].length === 4)) {
                return parseInt(split[1].substr(2, 2));
            }
        }
    }
    return -1;
}

export function check_configuration(e: vscode.ConfigurationChangeEvent) {
    if (e.affectsConfiguration("tml")) {
        init();
    }
}

function parse_date_from_folder(foldername: string): moment.Moment {

    return moment(foldername, "YYYY-MM-DD", true);
}

function get_documentation_from_csv(filepath: string, element_number: string): string {
    var fileData = fs.readFileSync(filepath, 'latin1').toString();

    const records = parse(fileData, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ";"
    });

    for (let record of records) {
        if (record["ElNr"] === element_number) {
            return typeof record["Kommentar"] === 'string' ? record["Kommentar"] : "";
        }
    }

    return "";
}