import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import Queryer from "./Queryer";
import DatasetManager, {DatasetSave} from "./DatasetManager";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dMgr: DatasetManager;

    constructor() {
        this.dMgr = new DatasetManager();
        Log.trace("InsightFacadeImpl::init()");
    }

    public debugMode(on: boolean) {
        if (on) {
            this.dMgr = new DatasetManager(true);
        }
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return this.dMgr.addDataset(id, content, kind);
    }

    public removeDataset(id: string): Promise<string> {
        return this.dMgr.removeDataset(id);
    }

    public performQuery(query: any): Promise <any[]> {
        let q: Queryer = new Queryer(this.dMgr);
        return q.doJob(query);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return this.dMgr.listDatasets();
    }
}
