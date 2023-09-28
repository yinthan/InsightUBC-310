import {Sorter} from "./Tools";
import Queryer from "./Queryer";
import {Transformer} from "./Transformer";

export class Options {
    private queryer: Queryer;
    private trans: any[][];
    private keys: string[];
    private rules: string[];
    private t: Transformer;

    // todo best RT
    constructor(q: Queryer, trans: any[], keys: string[], rules: string[], t: Transformer) {
        this.queryer = q;
        this.trans = trans;
        this.keys = keys;
        this.rules = rules;
        this.t = t;
    }

    public conformer(options: any): any[] | false {
        let response: any[] | false;
        if (this.trans.length === 0) {
            response = this.displaySections(options, this.queryer.record, this.queryer.sections);
        } else {
            response = this.displaySectionsTransformed(options);
        }
        if (Array.isArray(response)) {
            if (response.length > 5000) {
                return false;
            }
            response = this.sort(response, options.ORDER);
        }
        return response;
    }

    private displaySections(options: any, record: boolean[], sections: any[][]): any[] | false {
        let result: any[] = new Array(0);
        let cols: string[] = options.COLUMNS as string[];
        let i = 0;
        for (let sect of sections) {
            if (record[i]) {
                let row: any = {};
                for (let col of cols) {
                    let n: number = this.queryer.getIndex(col);
                    row[`${col}`] = sections[i][n];
                }
                result.push(row);
            }
            i++;
        }

        return result;
    }

    private displaySectionsTransformed (options: any): any[] | false {
        let result: any[] = new Array(0);
        let cols: string[] = options.COLUMNS as string[];

        for (let tran of this.trans) {
            result.push({});
        }

        for (let col of cols) {
            if (this.keys.includes(col)) {
                let i = 0;
                for (let group of this.trans) {
                    let row: any = result[i];
                    let arr = Object.values(group)[0][0];
                    // let arr = val.split(this.queryer.SEP);
                    row[`${col}`] = arr[this.t.getIndex(`${col}`)];
                    i++;
                }
            } else {
                let i = 0; // c
                for (let group of this.trans) {
                    let row: any = result[i];
                    row[`${col}`] = Object.values(group)[0][this.t.getIndexR(`${col}`) + 1];
                    i++;
                }
            }
        }

        return result;
    }

    private sort(result: any[], order: any): any[] {
        if (order === undefined || result.length === 0) {
            return result;
        }

        if (typeof(order) === "string") {
            let sorter: Sorter = new Sorter();
            sorter.quickSort(result, 0, result.length - 1, [order]);

            return result;
        } else {
            let ord = order.keys;
            if (ord.length === 0) {
                return result;
            }

            let sorter: Sorter = new Sorter();
            sorter.quickSort(result, 0, result.length - 1, ord);
            return order.dir === "UP" ? result : result.reverse();
        }
    }
}
