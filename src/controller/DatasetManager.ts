import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import Log from "../Util";
import DMHelper from "./DMHelper";
import * as JSZip from "jszip";
import {ParserFactory} from "./DMAbstractions";
import {IDatasetParser} from "./DMInterfaces";
// import Log from "../Util";
let fs = require("fs");

export class DatasetSave {
    public entries: string[][] | number[][];
    public index: number[][];
    public kind: InsightDatasetKind;
    public name: string;

    constructor(n: string, e: string[][] | number[][], i: number[][], k: InsightDatasetKind) {
        this.name = n;
        this.kind = k;
        this.entries = e;
        this.index = i;
    }
}

export default class DatasetManager {
    private addedDatasets: InsightDataset[];
    private addedDatasetNames: string[];
    private fileMap: Map<string, string>;
    private fileMapR: Map<string, string>;
    private readonly PATH: string = "./data/";
    private helper: DMHelper;
    private persistCompleted: boolean = false;

    // debug
    // public readonly dPATH: string = "./test/loaded/";
    // public readonly DMAP: Map<string, string>;
    // public readonly DEBUG: boolean;

    constructor(debug: boolean = false) {
        this.addedDatasets = [];
        this.addedDatasetNames = [];
        this.fileMap = new Map<string, string>();
        this.fileMapR = new Map<string, string>();

        this.helper = new DMHelper(this.addedDatasets,
            this.addedDatasetNames, this.fileMap, this.fileMapR, this);

        this.helper.persist();

        // if (debug) {
        //     const weirdID = "◕好n@#$%\n^&*\n[]\n{}+=-~`'0\n\r--lolButValid";
        //     let ds: any = {
        //         courses: {id: "courses", index: 3, kind: InsightDatasetKind.Courses, rows: 64612},
        //         rooms: {id: "rooms", index: 4, kind: InsightDatasetKind.Rooms, rows: 364},
        //         weirdID: {id: weirdID, index: 0, kind: InsightDatasetKind.Courses, rows: 99},
        //         coursesOne: {id: "coursesOne", index: 1, kind: InsightDatasetKind.Courses, rows: 99},
        //         toDel: {id: "toDel", index: 2, kind: InsightDatasetKind.Courses, rows: 99}
        //     };
        //
        //     let m = new Map<string, string>();
        //     for (let k of Object.keys(ds)) {
        //         let d = ds[k];
        //         let datasetProxy: InsightDataset = {id: d.id, kind: d.kind, numRows: d.rows};
        //         this.addedDatasets.push(datasetProxy);
        //         this.addedDatasetNames.push(d.id);
        //         m.set(d.id, d.index);
        //     }
        //
        //     this.DMAP = m;
        //     this.DEBUG = true;
        // } else {
        //     this.DEBUG = false;
        // }
    }

    // contents must now contain dataset name
    private writeSave(save: DatasetSave, raw: any): Promise<string> {
        return new Promise<string>( (resolve, reject) => {
            // let datasetName: string = save[0].substring(1, save[0].length - 1); // remove quotes
            let id = this.helper.getNewFileID(save.name);
            Log.p(`writing "${save.name}" to "${this.PATH}" as ${id}.json`, "b");
            let path: string = `${this.PATH}${id}.json`;

            fs.writeFileSync(path, `${JSON.stringify(save)}`);
            Log.p(`${id}.json created for "${save.name}" as a ${save.kind} dataset`, "w");

            return resolve(raw);
        });
    }

    private getZipFiles(zip: JSZip, kind: InsightDatasetKind): {files: JSZip.OutputType[], ks: string[]} {
        let pFiles: any = [];
        let rkeys = Object.keys(zip.files);
        let keys = rkeys;
        let rawLength = rkeys.length;

        // remove folder(s)
        let i: number = keys.length - 1;
        while (i >= 0) {
            let k: string = keys[i];
            // Log.p(`${i}:  ${k}`, "r");
            if (k.endsWith("/")) {
                Log.p(`folder \"${k}\" found`, "b");
                keys.splice(i, 1);
            } else if (!k.startsWith(`${kind}`)) {
                keys.splice(i, 1);
            }
            i--;
        }
        Log.p(`unzipping ${keys.length} items of ${rawLength}...`, "b");

        keys.forEach((key) => {
            pFiles.push(zip.file(key).async("text"));
        });

        return {files: pFiles, ks: keys};
    }

    public persistComplete(): Promise<boolean> {
        return new Promise<boolean>( (resolve) => {
            if (this.persistCompleted) {
                resolve(true);
            } else {
                resolve(this.persistComplete());  // wait a bit
            }
        });
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            let errMsg = this.helper.badParamsAdd(id, content, kind);
            if (errMsg) {
                reject(new InsightError(errMsg));
                return;
            }

            let pf = new ParserFactory(kind);
            let parser = pf.makeParser();

            let rawZip = new JSZip();
            Log.p(`>>> adding a ${kind} dataset as \"${id}\"...`);
            rawZip.loadAsync(content, {base64: true}).then((zip: JSZip) => {
                let d = this.getZipFiles(zip, kind);
                let pFiles: JSZip.OutputType[] = d.files;
                let keys = d.ks;
                return  Promise.all(pFiles).then( (files): Promise<any> => {
                    let packs = [];
                    for (let i = 0; i < files.length; i++) {
                        packs.push({name: keys[i], file: files[i]});
                    }
                    return Promise.resolve(packs);
                });
            }).then((data: Array<{name: string,  file: JSZip.OutputType}>): Promise<any[]> => {
                Log.p(`unzipped...`, "b");
                return parser.parseEntries(data);
            }).then ( (parsed: any[]): Promise<string> => {
                if (parsed.length === 0) {
                    throw new Error(`no entries found!`);
                }
                // let index: number[][] = this.helper.generateIndex(parsed);
                let save: DatasetSave = this.compileSave(id, parsed, parser);

                return this.writeSave(save, parsed);
            }).then ( (parsed: any) => {
                let datasetProxy: InsightDataset = {id: id, kind: kind, numRows: parsed.length};
                this.addedDatasets.push(datasetProxy);
                this.addedDatasetNames.push(id);
                resolve([...this.addedDatasetNames]);
                return;

            }).catch((err: any) => {
                Log.p(err, "r");
                reject(new InsightError(`${err}`));
                return;
            }); // cull for coverage
        });
    }

    public compileSave(id: string, parsed: any[], parser: IDatasetParser): DatasetSave {
        Log.p(`compiling save...`, "b");
        let cleanedData = new Array(parsed.length);
        let i = 0;
        for (let section of parsed) {
            let v = Object.values(section);
            // Log.p(`${v}`, "r");

            let cleanedEntry: string[] = new Array(v.length);
            let j = 0;
            for (let f of v) {

                cleanedEntry[j] = parser.compileEntry(j, v[j]);
                j++;
            }

            cleanedData[i] = cleanedEntry;
            i++;
        }
        Log.p(`${cleanedData.length} entries compiled`, "B");
        return new DatasetSave(id, cleanedData, [], parser.kind);
    }

    // returns an error message
    public loadDataset(id: string): Promise<DatasetSave> {
        Log.p(`>>> loading "${id}"`);
        return new Promise<DatasetSave>( (resolve, reject) => {
            let found = false;
            for (let nme of this.addedDatasetNames) {
                if (id === nme) {
                    found = true;
                    break;
                }
            }

            return this.helper.getFile(id).then( (d: {name: string, data: string}) => {
                let rName = d.name;
                // data[0] = data[0].replace(name, "x"); // unify callable
                let rd = JSON.parse(d.data);
                // let fName = rd.name;
                // if (rName !== fName) {
                //     throw new InsightError(`internal mismatch, given "${rName}" : found "${fName}"`, "r");
                // }

                let set = rd.entries;
                let kind = rd.kind;
                let index = rd.index;
                let ret: DatasetSave = new DatasetSave(rName, set, index, kind);
                Log.p(`"${rName}" loaded as DatasetSave`);
                return resolve(ret);
            });
            //     .catch ( (err: any) => {
            //     return reject("load failed " + err);
            // });
        });
    }

    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let errMsg = this.helper.badParamsRemove(id);
            if (errMsg) {
                reject(new InsightError(errMsg));
                return;
            }

            let found = false;
            let i = 0;
            for (let added of this.addedDatasetNames) {
                if (id === added) {
                    found = true;
                    break;
                }
                i++;
            }
            if (!found) {
                reject( new NotFoundError(`no such id: ${id}`));
                return;
            }

            Log.p(`>>> removing dataset "${id}"`, "w");
            this.addedDatasetNames.splice(i, 1);
            for (i = 0; i < this.addedDatasets.length; i++) {
                let d = this.addedDatasets[i];
                if (d.id === id) {
                    this.addedDatasets.splice(i, 1);
                    break;
                }
            }
            let msg = this.helper.removeFile(id);
            if (msg.good) {
                resolve(msg.msg);
            } else {
                reject(new InsightError(msg.msg));
            }
            return;
        });
    }

    public getAddedDatasets(): InsightDataset[] {
        return [...this.addedDatasets];
    }

    public listDatasets(): Promise<InsightDataset[]> {
        // returns clone, not original
        return new Promise<InsightDataset[]>((resolve, reject) => {
            resolve(this.getAddedDatasets());
        });
    }

    public getDatasetKind(id: string): InsightDatasetKind {
        for (let d of this.getAddedDatasets()) {
            if (id === d.id) {
                return d.kind;
            }
        }
    }
}
