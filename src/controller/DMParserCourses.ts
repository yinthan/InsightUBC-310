import * as JSZip from "jszip";
import Log from "../Util";
import {IDatasetParser} from "./DMInterfaces";
import {InsightDatasetKind} from "./IInsightFacade";

export class ParserCourses implements IDatasetParser {
    public readonly kind: InsightDatasetKind = InsightDatasetKind.Courses;
    private readonly fieldMap: any = {
        dept: "Subject",
        id: "Course",
        instructor: "Professor",
        title: "Title",
        uuid: "id",
        pass: "Pass",
        fail: "Fail",
        audit: "Audit",
        avg: "Avg",
        year: "Year",
    };

    private cullInvalid(entry: any): any[] | false {
        let out: any = new Array(Object.keys(this.fieldMap).length);
        let i = 0;

        if (entry.Section === "overall") {
            entry.Year = 1900;
        }

        for (let k of Object.keys(this.fieldMap)) {
            let kf = this.fieldMap[k];
            let val = entry[kf];

            if (val === undefined) {
                return false;
            }
            out[i] = entry[kf];
            i++;
        }
        return out;
    }

    private parse(file: string): any[] {
        return JSON.parse(file.toString()).result;
    }

    public parseEntries(files: Array<{name: string, file: JSZip.OutputType}>): Promise<any[]> {
        let acceptedEntries: any[] = [];
        Log.p(`parsing ${files.length} files...`, "b");
        let count = 0;
        let i = -1;
        for (let f of files) {
            i++;
            let entries: any[];
            try {
                entries = this.parse(f.file);
            } catch (e) {
                Log.p(`cannot read file ${i} of ${files.length}: ${f.name}`, "Y");
                continue;
            }

            if (entries.length === 0) {
                count++;
            }
            for (let entry of entries) {
                count ++;
                // Log.p(`${entry}`, "r");
                let parsed = this.cullInvalid(entry);
                if (parsed) {
                    acceptedEntries.push(parsed);
                }
            }
        }

        Log.p(`${acceptedEntries.length} valid entries of ${count}`, "b");
        return Promise.resolve(acceptedEntries);
    }

    public compileEntry(fieldID: number, entry: any): string {
        return fieldID === 9 ? parseInt(entry, 10) : fieldID === 4 ? `${entry}` : entry;
    }

    // public compileSave(id: string, parsed: any[]): any[] {
    //     Log.p(`compiling save...`, "b");
    //     let cleanedData: string[] = new Array(parsed.length);
    //     let i = 0;
    //     for (let section of parsed) {
    //         let v = Object.values(section);
    //         // Log.p(`${v}`, "r");
    //
    //         let cleanedEntry: string[] = new Array(v.length);
    //         let j = 0;
    //         for (let f of v) {
    //
    //             cleanedEntry[j] = v[j] as string;  // commas in names
    //             cleanedEntry[j] = j < 5 ? `"${cleanedEntry[j]}"` : cleanedEntry[j];     // some need to be in quotes
    //             j++;
    //         }
    //
    //         cleanedData[i] = `[${cleanedEntry}]`;
    //         i++;
    //     }
    //     Log.p(`${cleanedData.length} entries compiled`, "B");
    //     return [`"${id}"`, `[${cleanedData}]`];
    // }
}

// export class DatasetEntry {
//     public dept: string;
//     public id: string;
//     public instructor: string;
//     public title: string;
//     public uuid: string;
//     public pass: number;
//     public fail: number;
//     public audit: number;
//     public avg: number;
//     public year: number;
//
//     constructor() {
//         this.dept = "";
//         this.id = "";
//         this.instructor = "";
//         this.instructor = "";
//         this.title = "";
//         this.uuid = "";
//         this.pass = 0;
//         this.fail = 0;
//         this.audit = 0;
//         this.avg = 0;
//         this.year = 0;
//     }
// }
