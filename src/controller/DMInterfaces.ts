import * as JSZip from "jszip";
import {DatasetSave} from "./DatasetManager";
import {InsightDatasetKind} from "./IInsightFacade";

export interface IDatasetParser {
    readonly kind: InsightDatasetKind;
    parseEntries(files: Array<{name: string, file: JSZip.OutputType}>): Promise<any[]>;
    compileEntry(fieldID: number, entry: any): string;
}
