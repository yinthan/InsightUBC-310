import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {IDatasetParser} from "./DMInterfaces";
import {ParserCourses} from "./DMParserCourses";
import {ParserRooms} from "./DMParserRooms";

export class ParserFactory {
    private readonly kind: InsightDatasetKind;
    constructor(k: InsightDatasetKind) {
        this.kind = k;
    }

    public makeParser(): IDatasetParser {
        switch (this.kind) {
            case InsightDatasetKind.Rooms:
                return new ParserRooms();
            default:
                return new ParserCourses();
        }
    }

    // public makeParser(): IDatasetParser {
    //     switch (this.kind) {
    //         case InsightDatasetKind.Courses:
    //             return new ParserCourses();
    //         case InsightDatasetKind.Rooms:
    //             return new ParserRooms();
    //         default:
    //             throw new InsightError(`no such kind of dataset: ${this.kind}`);
    //     }
    // }
}
