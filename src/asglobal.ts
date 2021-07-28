

import fs = require('fs');
import * as vscode from 'vscode';
import moment = require('moment');
import { DBFFile } from 'dbffile';


let latest_asglobal_folder_global: string = "";

export function get_latest_asglobal_folder(asglobal_export_path: string): string {

    let latest_folder: string = "";
    let latest_date: moment.Moment;
    if (!fs.existsSync(asglobal_export_path)) {
        latest_asglobal_folder_global = "";
        return "ASGlobal Ordner existiert nicht. Überprüfe deine Einstellungen";
    }
    fs.readdirSync(asglobal_export_path).forEach(file => {
        console.log(file);
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
            vscode.window.showInformationMessage("Aktuellster AS Global Unterordner: " + latest_asglobal_folder_global)
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
    //TODO: normalize path
    const filepath = asglobal_path + "/" + latest_asglobal_folder_global + "/AS_" + AS.toString() + "/" + split[0] + "/" + split[1] + ".DBF";
    if (!fs.existsSync(filepath)) {
        return "";
    }
    let dbf = await DBFFile.open(filepath);
    //console.log(`DBF file contains ${dbf.recordCount} records.`);
    //console.log(`Field names: ${dbf.fields.map(f => f.name).join(', ')}`);
    //TODO: hier optimieren
    let records = await dbf.readRecords(255);
    for (let record of records) {
        console.log(typeof record["ELNR"]);

        if (record["ELNR"] === parseInt(split[2])) {
            console.log("found");

            return typeof record["KOMMENTAR"] === 'string' ? record["KOMMENTAR"] : "";
        }
    }
    return "";
}

function parse_date_from_folder(foldername: string): moment.Moment {

    return moment(foldername, "YYYY-MM-DD", true);
}