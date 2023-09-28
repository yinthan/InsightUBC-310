import Queryer from "./Queryer";
import Decimal from "decimal.js";
import {createSocket} from "dgram";

export class Transformer {
    private queryer: Queryer;
    private keys: string[];
    private rules: string[];

    constructor(q: Queryer) {
        this.queryer = q;
        this.keys = [];
        this.rules = [];
    }

    public getKeys(): string[] {
        return [...this.keys];
    }

    public getRules(): string[] {
        return [...this.rules];
    }

    public getIndex(s: any): number {
        return this.keys.findIndex((a) => a === s);
    }

    public getIndexR(s: any): number {
        return this.rules.findIndex((a) => a === s);
    }

    public transformations(trans: any): any[] {
        let result: any[] = [];
        if (trans === undefined) {
            return result;
        }

        let groups: any[] = this.findGroups(trans.GROUP);              // change

        for (let key of trans.GROUP) {
            this.keys.push(key);
        }

        if (trans.APPLY.length === 0) {
            return groups;
        }

        result = this.applyTrans(groups, trans.APPLY);     // change
        return result;
    }

    private findGroups(keys: string[]): any[] {
        let groups: any[] = [];
        let found: Map<string, number> = new Map<string, number>();             // added
        let i = 0;
        for (let r of this.queryer.record) {
            if (r) {
                let names = [];
                for (let k of keys) {
                    names.push(this.queryer.sections[i][this.queryer.getIndex(k)]);
                }
                let name = names.join(this.queryer.SEP);
                if (found.has(name)) {
                    groups[found.get(name)][name].push(this.queryer.sections[i]);
                } else {
                    let newGroup: any = {};
                    newGroup[`${name}`] = [names, this.queryer.sections[i]];    // original values as names first
                    found.set(name, groups.length);                             // added
                    groups.push(newGroup);
                }
            }
            i++;
        }
        return groups;
    }

    private applyTrans(groups: any[], rule: any[]): any[] {
        let result: any[] = new Array(groups.length);
        for (let i = 0; i < result.length; i++) {
            result[i] = {};
        }
        for (let r of rule) {
            let applykey = Object.keys(r)[0];
            this.rules.push(applykey);
            let applyrule = Object.values(r)[0];
            let applytoken = Object.keys(applyrule)[0];
            let key = Object.values(applyrule)[0];
            let i = 0;
            for (let group of groups) {
                let sections: any = Object.values(group)[0];
                let ori = sections.reverse().pop();                       // remove original vals for calc
                let ans;
                if (applytoken === "MAX") {
                    ans = this.maxMin(sections, key, 1);
                } else if (applytoken === "MIN") {
                    ans = this.maxMin(sections, key, -1);
                } else if (applytoken === "SUM") {
                    ans = this.sum(sections, key);
                } else if (applytoken === "COUNT") {
                    ans = this.count(sections, key);
                } else {
                    ans = this.avg(sections, key);
                }
                sections.push(ori);                                     // put it back
                sections.reverse();
                if (result[i][Object.keys(group)[0]] === undefined) {
                    result[i][Object.keys(group)[0]] = [ori];           // propagate original values
                }
                result[i][Object.keys(group)[0]].push(ans);
                i++;
            }
        }

        return result;
    }

    private maxMin(sections: any, key: any, marker: number): number {
        let index = this.queryer.getIndex(key);
        if (Array.isArray(sections)) {
            let temp = marker * sections[0][index];
            for (let section of sections) {
                if (marker * section[index] > temp) {
                    temp = marker * section[index];
                }
            }
            return marker * temp;
        }
        return -1;
    }

    private sum(sections: any, key: any): number {
        let sum = 0;
        let index = this.queryer.getIndex(key);
        if (Array.isArray(sections)) {
            for (let section of sections) {
                sum = sum + section[index];
            }
        }
        return Number(sum.toFixed(2));
    }

    private count(sections: any, key: any): number {
        let count = 0;
        let index = this.queryer.getIndex(key);
        let uniques: any[] = [];
        if (Array.isArray(sections)) {
            for (let section of sections) {
                if (!uniques.includes(section[index])) {
                    uniques.push(section[index]);
                    count++;
                }
            }
        }
        return count;
    }

    private avg(sections: any, key: any): number {
        let sum: Decimal = new Decimal(0);
        let index = this.queryer.getIndex(key);
        if (Array.isArray(sections)) {
            for (let section of sections) {
                sum = Decimal.add(sum, section[index]);
            }
        }
        let avg = sum.toNumber() / sections.length;
        return Number(avg.toFixed(2));
    }
}
