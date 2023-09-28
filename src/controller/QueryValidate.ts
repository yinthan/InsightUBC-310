import DatasetManager from "./DatasetManager";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";

export class QueryValidate {
    private dMgr: DatasetManager;
    private dataset: string[] = [];
    private groups: string[] = [];
    private applykeys: string[] = [];
    private columns: string[] = [];
    public desiredID: string;
    public PERSISTERROR = "ds not found, try persist";

    constructor(dataMgr: DatasetManager) {
        this.dMgr = dataMgr;
    }

    public getDataset(): string[] {
        return this.dataset;
    }

    public isQueryValid(query: any): Promise<boolean> {
        return Promise.resolve(this.iqv(query));
    }

    private iqv(query: any): boolean {
        if (!this.isObject(query)) {
            return false;
        }
        let arr = Object.keys(query);
        if (arr.length >= 2 && arr[0] === "WHERE" && arr[1] === "OPTIONS") {
            if (arr.length === 3 && arr[2] === "TRANSFORMATIONS") {
                return this.checkTransformations(query.TRANSFORMATIONS)
                    && this.checkFilter(query.WHERE) && this.checkOption(query.OPTIONS);
            } else if (arr.length === 2) {
                return this.checkFilter(query.WHERE) && this.checkOption(query.OPTIONS);
            }
        }
        return false;
    }

    private isObject(t: any) {
        return (typeof t === "object" && t !== null);
    }

    private checkFilter(query: any): boolean {
        if (!this.isObject(query) || Array.isArray(query)) {
            return false;
        }
        let arr = Object.keys(query);
        if (arr.length !== 1) {
            return arr.length === 0;
        } else {
            if (arr[0] === "AND" || arr[0] === "OR") {
                return this.LOGICCOMPARISON(query);
            } else if (arr[0] === "NOT") {
                return this.NEGATION(query);
            } else if (arr[0] === "LT" || arr[0] === "GT" || arr[0] === "EQ") {
                return this.MSCOMPARISON(query, "MCOMPARISON");
            } else if (arr[0] === "IS") {
                return this.MSCOMPARISON(query, "SCOMPARISON");
            }
        }
        return false;
    }

    private LOGICCOMPARISON(query: any) {
        let arr = Object.keys(query);
        let key = arr[0];
        if (this.isObject(query[key]) && Array.isArray(query[key])) {
            let length = Object.values(query[key]).length;
            if (length < 1) {
                return false;
            } else {
                let arrFilter = Object.values(query[key]);
                for (let filter of arrFilter) {
                    if (!this.checkFilter(filter)) {
                        return false;
                    }
                }
                return true;
            }
        }
    }

    private NEGATION(query: any) {
        if (this.isObject(query.NOT) && Object.values(query.NOT).length === 1) {
            return this.checkFilter(query.NOT);
        }
        return false;
    }

    private MSCOMPARISON(query: any, comparisonType: string) {
        if (Object.values(query).length !== 1) {
            return false;
        }
        let comparator = Object.keys(query)[0];
        if (this.isObject(query[comparator]) && Object.values(query[comparator]).length === 1) {
            let key = Object.keys(query[comparator])[0];
            let istring = Object.values(query[comparator])[0];
            if (comparisonType === "MCOMPARISON") {
                if (this.checkKey(key, 1) && typeof istring === "number") {
                    return true;
                }
            } else if (comparisonType === "SCOMPARISON") {
                if (this.checkKey(key, 2) && typeof istring === "string"
                    && (istring.length < 3 || !istring.substring(1, istring.length - 1).includes("*"))) {
                    return true;
                }
            }
        }
        return false;
    }

    private checkKey(key: string, f: number): boolean {
        if (typeof key === "string") {
            let index = key.indexOf("_");
            if (index > 0) {
                let idstring = key.substring(0, index);
                if (this.checkIDString(idstring)) {
                    if (this.dMgr.getDatasetKind(idstring) === InsightDatasetKind.Rooms) {
                        f = f + 2;
                    }
                    if ((this.checkField(key.substring(index + 1))) === f) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private checkIDString(temp: string): boolean {
        if (this.dataset.length === 0) {
            if (temp.length > 0 && !temp.includes("_")) {
                for (let addeddataset of this.dMgr.getAddedDatasets()) {
                    if (addeddataset.id === temp) {
                        this.dataset.push(temp);
                        return true;
                    }
                }
                this.desiredID = temp;
            } else {
                return false;
            }
        } else {
            if (temp === this.dataset[0]) {
                return true;
            } else {
                return false;
            }
        }
    }

    private checkField(field: string): number {
        let coursesSfield = ["dept", "id", "instructor", "title", "uuid"];
        let coursesMfield = ["pass", "fail", "audit", "avg", "year"];
        let roomsMfield = ["lat", "lon", "seats"];
        let roomsSfield = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
        if (coursesMfield.includes(field)) {
            return 1;
        }
        if (coursesSfield.includes(field)) {
            return 2;
        }
        if (roomsMfield.includes(field)) {
            return 3;
        }
        if (roomsSfield.includes(field)) {
            return 4;
        }
        return 0;
    }

    private checkOption(option: any): boolean {
        if (!this.isObject(option) || Array.isArray(option)) {
            return false;
        }
        let arr = Object.keys(option);
        if (arr.length === 1 || arr.length === 2) {
            if (option.COLUMNS !== undefined && this.checkColumns(option.COLUMNS)) {
                if (arr.length === 1) {
                    return true;
                } else if (option.ORDER !== undefined && option.ORDER !== null) {
                    return this.checkSort(option.ORDER);
                }
            }
        }
        return false;
    }

    private checkColumns(column: any): boolean {
        if (this.isObject(column) && Array.isArray(column) && column.length > 0) {
            for (let key of column) {
                if (!(this.checkKey(key, 1) || this.checkKey(key, 2) ) && !this.checkApplyKey(key)) {
                    return false;
                }
                if (this.groups.length > 0 && (!this.groups.includes(key) && !this.applykeys.includes(key))) {
                    return false;
                }
                this.columns.push(key);
            }
            return true;
        }
        return false;
    }

    private checkApplyKey(temp: string): boolean {
        if (temp.length > 0 && !temp.includes("_")) {
            return true;
        }
        return false;
    }

    private checkOrderkey(temp: string): boolean {
        return this.checkKey(temp, 1) || this.checkKey(temp, 2) || this.checkApplyKey(temp);
    }

    private checkSort(order: any): boolean {
        if (typeof order === "string") {
            return this.checkOrderkey(order) && this.columns.includes(order);
        }
        if (typeof order === "object") {
            if (order.dir === undefined || order.keys === undefined ||
                (order.dir !== "UP" && order.dir !== "DOWN")) {
                return false;
            }
            if (Array.isArray(order.keys) && order.keys.length > 0) {
                for (let key of order.keys) {
                    if (!this.checkOrderkey(key) || !this.columns.includes(key)) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }

    private checkTransformations(trans: any): boolean {
        if (!this.isObject(trans) || Array.isArray(trans)) {
            return false;
        }
        let arr = Object.keys(trans);
        if (arr.length === 2) {
            if (trans.GROUP !== undefined && trans.APPLY !== undefined) {
                return this.checkGroup(trans.GROUP) && this.checkApply(trans.APPLY);
            }
        }
        return false;
    }

    private checkGroup(group: any): boolean {
        if (!Array.isArray(group) || group.length < 1) {
            return false;
        }
        for (let key of group) {
            if (!this.checkKey(key, 1) && !this.checkKey(key, 2)) {
                return false;
            }
            this.groups.push(key);
        }
        return true;
    }

    private checkApply(apply: any): boolean {
        if (!Array.isArray(apply)) {
            return false;
        }
        for (let applyrule of apply) {
            if (!this.checkApplyrule(applyrule)) {
                return false;
            }
        }
        return true;
    }

    private checkApplyrule(applyrule: any): boolean {
        if (!this.isObject(applyrule) || Array.isArray(applyrule) || Object.keys(applyrule).length !== 1) {
            return false;
        }
        let applykey = Object.keys(applyrule)[0];
        if (!this.checkApplyKey(applykey) || this.applykeys.includes(applykey)) {
            return false;
        }
        this.applykeys.push(applykey);
        let rule = Object.values(applyrule)[0];
        if (!this.isObject(rule) || Array.isArray(rule) || Object.keys(rule).length !== 1) {
            return false;
        }
        let tokes = ["MAX", "MIN", "AVG", "SUM"];
        if (tokes.includes(Object.keys(rule)[0])) {
            return this.checkKey(Object.values(rule)[0], 1);
        } else if (Object.keys(rule)[0] === "COUNT") {
            return (this.checkKey(Object.values(rule)[0], 1) || this.checkKey(Object.values(rule)[0], 2));
        }
        return false;
    }
}
