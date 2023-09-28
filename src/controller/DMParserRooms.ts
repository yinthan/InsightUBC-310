import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as JSZip from "jszip";
import Log from "../Util";
import {IDatasetParser} from "./DMInterfaces";
import {GeoLocator, IGeoResponse} from "./DMhttps";

let parse5 = require("parse5");

export class ParserRooms implements IDatasetParser {
    private locator: GeoLocator;
    public readonly kind: InsightDatasetKind = InsightDatasetKind.Rooms;
    private fieldMap: any = {
        fullname: 0,
        shortname: 1,
        number: 2,
        name: 3,
        address: 4,
        lat: 5,
        lon: 6,
        seats: 7,
        type: 8,
        furniture: 9,
        href: 10
    };

    constructor() {
        this.locator = new GeoLocator();
    }

    public parse(file: string): any {
        // throw new InsightError("not implemented");
        // Log.p(file, "R");
        // let p = parse5.parse(file.toString);
        // fs.writeFileSync(`./data/a${this.n}.txt`, file.toString());
        return parse5.parse(file);
    }

    private treeSearch(tree: any, match: (node: any) => boolean): any[] | false {
        if (match(tree)) {
            return [tree];
        }

        if (tree.childNodes === undefined) {
            return false;
        }

        let bucket: any[] = [];
        for (let n of tree.childNodes) {
            let result = this.treeSearch(n, match);
            if (result !== false) {
                bucket = bucket.concat(result);
            }
        }

        if (bucket.length === 0) {
            return false;
        } else {
            return bucket;
        }
    }

    private getFileCommon(file: any): {fullName: string, address: string} | false {
        let result = this.treeSearch(file,  (node) => {
            let attrs = node.attrs;
            if (attrs !== undefined) {
                for (let a of attrs) {
                    if (a.name === "id" && a.value === "building-info") {
                        return true;
                    }
                }
            }
            return false;
        });

        if (!result) {
            return false;
        }

        let n = result[0];
        let name = n.childNodes[1].childNodes[0].childNodes[0].value;
        let address = n.childNodes[3].childNodes[0].childNodes[0].value;
        return {fullName: name, address: address};
    }

    private getHrefAndNumber(field: any): {href: string, num: string} {   // within td tag
        let result: any = {};
        let found = 0;
        for (let n of field.childNodes) {
            if (n.nodeName === "a") {
                for (let a of n.attrs) {
                    if (a.name === "href") {
                        result.href = a.value;
                        found++;
                    }
                }

                found++;
                result.num = n.childNodes[0].value;
            }
        }

        // if (found !== 2) {
        //     throw new InsightError("get href: not found");
        // } else {
        return result;
        // }
    }

    private getFields(rawEntry: any, candidates: Map<string, string>): Map<string, string> {
        let result = new Map<string, string>();
        for (let field of rawEntry.childNodes) {    // each field of entry; "td" tag
            if (field.attrs === undefined) {        // some nodes have no attr
                continue;
            }
            for (let attr of field.attrs) {
                if (candidates.has(attr.value)) {   // is field and not some random tag
                    let fName = candidates.get(attr.value);
                    if (fName === "number") {       // href is also here
                        let d = this.getHrefAndNumber(field);
                        result.set(fName, d.num);
                        result.set("href", d.href);
                    } else {
                        let value = field.childNodes[0].value;
                        value = value.substring(1); // first character is \n
                        value = value.trim();       // usually surrounded by blank space
                        result.set(fName, value);
                    }
                }
            }

        }

        return result;
    }

    private constructEntry(parsed: any, commons: any): any[] | false {
        let tables: any[] |false = this.treeSearch(parsed, (node: any): boolean => {
            return node.nodeName === "tbody";
        });

        if (!tables) {
            return false;
        }

        let entries = [];

        let candidates = new Map<string, string>();
        candidates.set("views-field views-field-field-room-number", "number");
        candidates.set("views-field views-field-field-room-capacity", "seats");
        candidates.set("views-field views-field-field-room-type", "type");
        candidates.set("views-field views-field-field-room-furniture", "furniture");

        for (let t of tables) {                 // if more than one table
            for (let rawEntry of t.childNodes) {   // each entry; "tr" tag
                if (rawEntry.nodeName !== "tr") {
                    continue;
                }

                let entry: any[] = Array(Object.keys(this.fieldMap).length);    // should be 11 ... forever
                let fields = this.getFields(rawEntry, candidates);
                fields.set("fullname", commons.fullName);
                fields.set("shortname", commons.name);
                fields.set("address", commons.address);
                fields.set("name", `${commons.name}_${fields.get("number")}`);
                for (let key of fields.keys()) {
                    entry[this.fieldMap[key]] = fields.get(key);
                }

                entries.push(entry);
            }
        }

        return entries;
    }

    private addLocations(entries: any[][]): Promise<any[][]> {
        let responses: any[] = [];
        for (let ele of entries) {
            responses.push(this.locator.getLocation(ele[this.fieldMap["address"]]).then(
                (res: IGeoResponse): {loc: IGeoResponse, entry: any[]} => {
                return {loc: res, entry: ele};
            }));
        }

        return Promise.all(responses).then((res: Array<{loc: IGeoResponse, entry: any[]}>): any[][] => {
            let accepted = [];
            let reject = 0;
            for (let r of res) {
                if (r.loc.error) {
                    reject ++;
                    continue;
                }

                r.entry[this.fieldMap["lat"]] = r.loc.lat;
                r.entry[this.fieldMap["lon"]] = r.loc.lon;

                accepted.push(r.entry);
            }

            Log.p(`rejected ${reject} locations`, "B");
            return accepted;
        });
    }

    public parseEntries(files: Array<{name: string, file: JSZip.OutputType}>): Promise<any[]> {
        let acceptedEntries: any[] = [];
        let i = -1;
        let parsed: any;
        for (let f of files) {
            i++;
            parsed = this.parse(f.file);
            // Log.p(`getFileCommons: ${i}`);
            let commons: any = this.getFileCommon(parsed);
            if (!commons) {
                continue;
            }

            commons.name = f.name.substring(f.name.lastIndexOf("/") + 1);
            let entries = this.constructEntry(parsed, commons);
            if (!entries) {
                continue;
            }

            acceptedEntries = acceptedEntries.concat(entries);
        }
        Log.p(`${acceptedEntries.length} valid entries`, "b");
        Log.p(`adding locations...`, "b");
        return this.addLocations(acceptedEntries);
    }

    public compileEntry(fieldID: number, entry: any): string {
        return fieldID === 7 ? parseInt(entry, 10) : fieldID < 7 && fieldID > 4 ? parseFloat(entry) : entry;
    }
}
