import {InsightDatasetKind, InsightError, ResultTooLargeError} from "./IInsightFacade";
import DatasetManager, {DatasetSave} from "./DatasetManager";
import {QueryValidate} from "./QueryValidate";
import {Transformer} from "./Transformer";
import {Options} from "./Options";
import Log from "../Util";

interface ITargetData {
    isWild: boolean;
    front: boolean;
    back: boolean;
    target: string;
}

export default class Queryer {
    private dMgr: DatasetManager;
    private q: QueryValidate;
    private t: Transformer;
    private o: Options;
    private dataset: string[] = [];
    public record: boolean[];
    public sections: any[][];

    public readonly SEP = "dfghjkjhg#$%^&*()(*&^%$";

    constructor(dataMgr: DatasetManager) {
        this.dMgr = dataMgr;
    }

    public doJob(query: any): Promise <any[]> {
        return new Promise<any>( (resolve, reject) => {
            Log.p(`checking validity...\n${JSON.stringify(query)}\n`, "b");
            this.q = new QueryValidate(this.dMgr);
            this.q.isQueryValid(query).then( (iqv: boolean) => {
                return iqv;

                // return this.dMgr.persistComplete().then( () => {
                //     return this.q.isQueryValid(query);
                // }).catch( () => {
                //     return false;
                // });
            }).then( (iqv: boolean) => {
                if (iqv) {
                    Log.p(`valid, beginning search...`, "b");
                    // todo heyo RT >> hope this is ok :D
                    this.dataset = this.q.getDataset();
                    const id = this.dataset[0];
                    this.dMgr.loadDataset(id).then( (val: DatasetSave) => {
                        const datas: DatasetSave = val;
                        this.sections = datas.entries;
                        Log.p(`finding entries...`, "B");
                        this.record = this.findSections(query.WHERE, this.sections);
                        this.t = new Transformer(this);
                        Log.p(`applying transformations...`, "B");
                        let trans = this.t.transformations(query.TRANSFORMATIONS);
                        let k = this.t.getKeys();
                        let r = this.t.getRules();
                        this.o = new Options(this, trans, k, r, this.t);
                        Log.p(`compiling results...`, "B");
                        let response: any[] | false = this.o.conformer(query.OPTIONS);
                        if (!response) {
                            reject(new ResultTooLargeError());
                        } else {
                            resolve(response as any[]);
                            Log.p(`search complete`, "b");
                        }
                    }).catch((err) => {
                        return reject(new InsightError("failed in Q " + err));
                    });
                } else {
                    // Log.p(`false`, "r");
                    reject(new InsightError("Invalid Query Structure"));
                    return;
                }
            });
        });
    }

    private findSections(where: any, sections: any[][]): boolean[] {
        let filterType: string = Object.keys(where)[0];
        if (filterType === undefined) {
            return new Array(sections.length).fill(true);
        }
        let value = where[filterType];
        let innerType: string = Object.keys(where[filterType])[0];
        let innerValue = where[filterType][innerType];
        let record: boolean[] = [];
        if (this.isObject(innerValue)) {
            if (filterType === "NOT") {
                record = this.findSections(value, sections);
                for (let m = 0; m < record.length; m++) {
                    record[m] = !record[m];
                }
            } else {
                record = this.logOp(record, sections, filterType, value);
            }
        } else {
            let fieldIndex: number = this.getIndex(innerType);
            record = new Array(sections.length);
            if (typeof innerValue === "number") {
                let comparator: (a: number, b: number) => boolean;
                switch (filterType) {
                    case "LT":
                        comparator = (a: number, b: number): boolean => a < b;
                        break;
                    case "GT":
                        comparator = (a: number, b: number): boolean => a > b;
                        break;
                    case "EQ":
                        comparator = (a: number, b: number): boolean => a === b;
                        break;
                }
                record = this.findM(innerValue, sections, fieldIndex, comparator);
            } else {
                record = this.findS(innerValue, sections, fieldIndex);
            }
        }
        return record;
    }

    private logOp(record: boolean[], sections: any[], filterType: string, value: any[]): boolean[] {
        let length = sections.length;
        record = new Array(length);
        if (filterType === "AND") {
            for (let i = 0; i < length; i++) {
                record[i] = true;
            }
            for (let filter of value) {
                let part: boolean[] = this.findSections(filter, sections);
                for (let i = 0; i < record.length; i++) {
                    record[i] = record[i] && part[i];
                }
            }
        } else {
            for (let filter of value) {
                let part: boolean[] = this.findSections(filter, sections);
                for (let i = 0; i < record.length; i++) {
                    record[i] = part[i] || record[i];
                }
            }
        }
        return record;
    }

    private findM(target: number, sections: any[][], field: number, c: (a: number, b: number) => boolean): boolean[] {
        let part: boolean[] = new Array(sections.length);
        let i = 0;
        for (let sect of sections) {
            if (c(sect[field], target)) {
                part[i] = true;
            }
            i++;
        }
        return part;
    }

    private processWild(target: string): ITargetData {
        target = target.toString();
        let ret: ITargetData = {isWild: false, front: false, back: false, target};
        if (target.indexOf("*") !== -1) {
            if (target.startsWith("*")) {
                ret.isWild = true;
                ret.front = true;
                ret.target = ret.target.substring(1);
            }
            if (target.endsWith("*")) {
                ret.isWild = true;
                ret.back = true;
                ret.target = ret.target.substring(0, ret.target.length - 1);
            }
        }

        return ret;
    }

    private findS(rawTarget: string, sections: any[][], field: number): boolean[] {
        let part: boolean[] = new Array(sections.length);
        let targetData = this.processWild(rawTarget);
        let i = 0;
        for (let sect of sections) {
            if (this.stringEquals(targetData, sect[field])) {
                part[i] = true;
            }
            i++;
        }

        return part;
    }

    private stringEquals(target: ITargetData, ref: string): boolean {
        if (target.isWild) {
            if (target.front && target.back) {
                return ref.indexOf(target.target) !== -1;
            } else if (target.front) {
                return ref.endsWith(target.target);
            } else {
                return ref.startsWith(target.target);
            }
        } else {
            return ref === target.target;
        }
    }

    private isObject(t: any) {
        return (typeof t === "object" && t !== null);
    }

    public getIndex(field: string): number {
        let f = field.substring(field.indexOf("_") + 1, field.length);
        if (this.dMgr.getDatasetKind(this.dataset[0]) === InsightDatasetKind.Courses) {
            return this.getIndexC(f);
        }
        return this.getIndexR(f);
    }

    private getIndexC(field: string): number {
        let fields = ["dept", "id", "instructor", "title", "uuid", "pass", "fail", "audit", "avg", "year"];
        return fields.findIndex((a) => a === field);
    }

    private getIndexR(field: string): number {
        let fields = ["fullname", "shortname", "number", "name",
            "address", "lat", "lon", "seats", "type", "furniture", "href"];
        return fields.findIndex((a) => a === field);
    }
}
