import {expect} from "chai";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import {Sorter} from "../src/controller/Tools";
import {GeoLocator, IGeoResponse} from "../src/controller/DMhttps";
import * as http from "http";
import DatasetManager, {DatasetSave} from "../src/controller/DatasetManager";

let fs = require("fs-extra");

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

const weirdID = "◕好n@#$%\n^&*\n[]\n{}+=-~`'0\n\r--lolButValid";

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        coursesOne: "./test/data/coursesOne.zip",
        CWOthers: "./test/data/CWOthers.zip",
        empty: "./test/data/empty.zip",
        emptyC: "./test/data/emptyC.zip",
        falseExt: "./test/data/falseExt.zip",
        noFolder: "./test/data/noFolder.zip",
        others: "./test/data/others.zip",
        badSectionA: "./test/data/badSectionA.zip",
        badSectionR: "./test/data/badSectionR.zip",
        ext: "./test/data/ext.zip",
        notZip: "./test/data/notZip.png",
        picContent: "./test/data/picContent.zip",
        weird: "./test/data/weird~!@#$%^&().zip",
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
    };

    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    const idc = "coursesOne";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    it("doorway", function () {
        return new Promise( (resolve, reject) => {
            let t: boolean[] = new Array(5); // 66000);

            for (let i = 0; i < t.length; i++) {
                t[i] = !t[i];
            }

            Log.p(`${!!t[0] === false}`);
            Log.p(`${"".indexOf("")} : ${typeof 0}`);
            resolve();
        }).then ( () => {
            return;
        });
    });

    it("should get a http request", function () {
        const PATHb = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team";
        const TEAM = 116;
        let address = "2194%20Health%20Sciences%20Mall";
        return new Promise((resolve) => {
            http.get(`${PATHb}${TEAM}/${address}`, (res: any) => {
                res.on("data", (d: IGeoResponse) => {
                    resolve(d);
                });
            }).on("error", (e: IGeoResponse) => {
                resolve(e);
            });
        }).then( (res: IGeoResponse) => {
            if ( res.error ) {
                expect.fail(res);
            } else {
                Log.p(res.toString(), "R");
            }
        });
    });

    it("Should sort an array", function () {
        return new Promise( (resolve) => {
            let s = new Sorter();
            let l = 200, r = 40;
            let a: any[] = new Array(l);
            for (let i = 0; i < a.length; i++) {
                a[i] = {
                    a: Math.round(Math.random() * r), b: Math.round(Math.random() * r),
                    c: Math.round(Math.random() * r)
                };
            }

            let k =  ["a", "b", "c"];
            // let k =  ["c"];
            s.quickSort(a, 0, a.length - 1, k);

            let prA = [], prB = [];
            let pl = 5;
            for (let i = 0; i < pl; i++) {
                prA.push(a[i]);
            }
            for (let i = a.length - pl; i < a.length; i++) {
                prB.push(a[i]);
            }
            let conv = (ele: any) => {
                let ret = "";
                for (let key of Object.keys(ele)) {
                    ret += `${key}:${ele[key]},`;
                }
                return `{${ret.substring(0, ret.length - 1)}}`;
            };
            Log.p(`sorted ${l} items, sample: ${prA.map(conv).join(", ")}...${prB.map(conv).join(", ")}`, "w");
            for (let i = 0; i < a.length - 1; i++) {
                let depth = 0;
                while (depth < k.length) {
                    if (a[i][k[depth]] > a[i + 1][k[depth]]) {
                        Log.p(`${a[i][k[depth]]} > ${a[i + 1][k[depth]]} at index ${i}, depth ${depth}`, "r");
                        expect.fail();
                    } else if (a[i][k[depth]] === a[i + 1][k[depth]]) {
                        depth++;
                    } else {
                        break;
                    }
                }
            }
            resolve();
        }).catch( (err) => {
            Log.p(`${err}`, "r");
            expect.fail(err +  " Should not have rejected");
        });
    });


    it("Should sort an array single", function () {
        return new Promise( (resolve) => {
            let s = new Sorter();
            let l = 200, r = 150;
            let a: any[] = new Array(l);
            for (let i = 0; i < a.length; i++) {
                a[i] = {
                    // a: Math.round(Math.random() * r), b: Math.round(Math.random() * r),
                    c: `x${ Math.round(Math.random() * r)}`
                };
            }

            // let k =  ["a", "b", "c"];
            let k =  ["c"];
            s.quickSort(a, 0, a.length - 1, k);

            let prA = [], prB = [];
            let pl = 5;
            for (let i = 0; i < pl; i++) {
                prA.push(a[i]);
            }
            for (let i = a.length - pl; i < a.length; i++) {
                prB.push(a[i]);
            }
            let conv = (ele: any) => {
                let ret = "";
                for (let key of Object.keys(ele)) {
                    ret += `${key}:${ele[key]},`;
                }
                return `{${ret.substring(0, ret.length - 1)}}`;
            };
            Log.p(`sorted ${l} items, sample: ${prA.map(conv).join(", ")}...${prB.map(conv).join(", ")}`, "w");
            for (let i = 0; i < a.length - 1; i++) {
                let depth = 0;
                while (depth < k.length) {
                    if (a[i][k[depth]] > a[i + 1][k[depth]]) {
                        Log.p(`${a[i][k[depth]]} > ${a[i + 1][k[depth]]} at index ${i}, depth ${depth}`, "r");
                        expect.fail();
                    } else if (a[i][k[depth]] === a[i + 1][k[depth]]) {
                        depth++;
                    } else {
                        break;
                    }
                }
            }
            resolve();
        }).catch( (err) => {
            Log.p(`${err}`, "r");
            expect.fail(err +  " Should not have rejected");
        });
    });

    it("Should add a valid dataset with only chem121 - add", function () {
        const id: string = idc;
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.p(err, "r");
            expect.fail(err +  " Should not have rejected");
        });
    });

    it("Should add the valid dataset courses - zip", function () {
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            }).catch((err: any) => {
                expect.fail(err +  " Should not have rejected");
            });
    });

    it("Should add the valid dataset rooms - zip", function () {
        const id: string = "rms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets["rooms"], InsightDatasetKind.Rooms)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            }).catch((err: any) => {
                expect.fail(err +  " Should not have rejected");
            });
    });

    it("Should add valid with pic - zip", function () {
        const id: string = "picContent";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses)
            .then((result: string[]) => {
                expect(result).to.deep.equal(expected);
            }).catch((err: any) => {
                expect.fail(err +  " Should not have rejected");
            });
    });

    it("Should add very weird id - add", function () {
        const expected: string[] = [weirdID];
        return insightFacade.addDataset(weirdID, datasets["weird"], InsightDatasetKind.Courses).then((
            result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err +  " Should not have rejected");
        });
    });

    it("Should not add a duplicate dataset - add", function () {
        const id: string = idc;
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses)
                .then((result2: string[]) => {
                    expect.fail(result2.toString() +  " Should not have rejected");
                }).catch((err1: any) => {
                    // expect(datasets).to.deep.equal(expected);
                    Log.p(`${err1}`, "w");
                });
        }).catch((err2: any) => {
            expect.fail(err2 +  " Should not have rejected");
        });
    });

    it("Should reject an empty id - add", function () {
        const id: string = "";
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() +  " Should not have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject an id with only white spaces - add", function () {
        const id: string = "   ";
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject an id with white spaces end - add", function () {
        const id: string = " _";
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject an id with white spaces end - add", function () {
        const id: string = "_ ";
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject an id with underscore - add", function () {
        const id: string = "courses_";
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    // it("Should reject a not found id - add", function () {
    //     const id: string = "coursesB";
    //     return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses)
    //       .then((result: string[]) => {
    //         expect.fail(result.toString() + " Should not have passed");
    //     }).catch((err: any) => {
    //         Log.p(`${err}`, "r");
    //         expect(err).to.be.instanceOf(InsightError);
    //     });
    // });

    it("Should reject a content type mismatch - add", function () {
        const id: string = idc;
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject non 64x content - add", function () {
        const id =  "coursesascii";
        const ascii = fs.readFileSync(datasetsToLoad[ idc ]).toString("ascii");
        return insightFacade.addDataset(id, ascii, InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject undefined id - add", function () {
        return insightFacade.addDataset(
            undefined, datasets[idc], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject undefined content - add", function () {
        return insightFacade.addDataset(
            idc, undefined, InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject undefined kind - add", function () {
        return insightFacade.addDataset(
            idc, datasets[idc], undefined).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject a null id - add", function () {
        return insightFacade.addDataset(null, datasets[idc], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject a null content - add", function () {
        return insightFacade.addDataset(idc, null, InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject a null kind - add", function () {
        return insightFacade.addDataset(idc, datasets[idc], null).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    // ### content below this ###################################################################
    // ###
    // ### content below this ###################################################################

    it("Should add a valid dataset with json ext - add", function () {
        const id: string = "ext";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err +  " Should not have rejected");
        });
    });

    it("Should add valid with other folder - zip", function () {
        const id: string = "CWOthers";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err +  " Should not have rejected");
        });
    });

    it("Should accept zip with a bad section - zip", function () {
        const id: string = "badSectionA";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err +  " Should not have rejected");
        });
    });

    // ### reject

    it("Should reject empty - zip", function () {
        const id: string = "empty";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject empty courses folder - zip", function () {
        const id: string = "emptyC";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject false ext - zip", function () {
        const id: string = "falseExt";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject no folder - zip", function () {
        const id: string = "noFolder";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject zip with only \"others\" - zip", function () {
        const id: string = "others";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject zip with only bad section - zip", function () {
        const id: string = "badSectionR";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    it("Should reject non zip - zip", function () {
        const id: string = "notZip";
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError);
        });
    });

    // ### remove below this ###################################################################
    // ### remove below this
    // ### remove below this
    // ### remove below this
    // ### remove below this ###################################################################

    it("Should remove an added dataset - remove", function () {
        const id: string = idc;
        const expected: string = id;
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.removeDataset(id).then((result2: string) => {
                expect(result2).to.deep.equal(expected);
            }).catch((err2: any) => {
                expect.fail(err2 + " Should not have rejected - remove");
            });
        }).catch((err1: any) => {
            Log.p(err1, "r");
            expect.fail(err1 + " Should not have rejected - add");
        });
    });

    it("Should work with a weird id - remove", function () {
        const id: string = weirdID;
        const expected: string = weirdID;
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.removeDataset(id).then((result2: string) => {
                expect(result2).to.deep.equal(expected);
            }).catch((err2: any) => {
                expect.fail(err2 + " Should not have rejected - remove");
            });
        }).catch((err1: any) => {
            expect.fail(err1 + " Should not have rejected - add");
        });
    });

    it("Should reject on save removal - remove", function () {
        return insightFacade.addDataset(idc, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            fs.unlinkSync("./data/0.json");
            return insightFacade.removeDataset(idc).then((result2: string) => {
                expect.fail(result2.toString() + " Should have rejected - remove");
            }).catch((err2: any) => {
                expect(err2).to.be.instanceOf(InsightError);
            });
        }).catch((err1: any) => {
            Log.p(err1, "r");
            expect.fail(err1 + " Should not have rejected - add");
        });
    });

    it("Should reject an empty id - remove", function () {
        const id: string = "";
        return insightFacade.addDataset(idc, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.removeDataset(id).then((result2: string) => {
                expect.fail(result2.toString() + " Should have rejected - remove");
            }).catch((err2: any) => {
                expect(err2).to.be.instanceOf(InsightError);
            });
        }).catch((err1: any) => {
            Log.p(err1, "r");
            expect.fail(err1 + " Should not have rejected - add");
        });
    });

    it("Should reject an all whitespace id - remove", function () {
        const id: string = "   ";
        return insightFacade.addDataset(idc, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.removeDataset(id).then((result2: string) => {
                expect.fail(result2.toString() + " Should have rejected - remove");
            }).catch((err2: any) => {
                expect(err2).to.be.instanceOf(InsightError);
            });
        }).catch((err1: any) => {
            expect.fail(err1 + " Should not have rejected - add");
        });
    });

    it("Should reject an id with underscore - remove", function () {
        const id: string = "courses_";
        return insightFacade.addDataset(idc, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.removeDataset(id).then((result2: string) => {
                expect.fail(result2.toString() + " Should have rejected - remove");
            }).catch((err2: any) => {
                expect(err2).to.be.instanceOf(InsightError);
            });
        }).catch((err1: any) => {
            expect.fail(err1 + " Should not have rejected - add");
        });
    });

    it("Should reject a not found id - remove", function () {
        const id: string = "coursesB";
        return insightFacade.addDataset(idc, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.removeDataset(id).then((result2: string) => {
                Log.p(`unexpected pass: ${result2}`, "r");
                expect.fail(result2.toString() + " Should have rejected - remove");
            }).catch((err2: any) => {
                Log.p(err2, "r");
                expect(err2).to.be.instanceOf(NotFoundError);
            });
        }).catch((err1: any) => {
            Log.p(err1, "r");
            expect.fail(err1 + " Should not have rejected - add");
        });
    });

    it("Should add remove add - remove", function () {
        return insightFacade.addDataset(idc, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.removeDataset(idc);
        }).then((result2: string) => {
            return insightFacade.addDataset(idc, datasets[idc], InsightDatasetKind.Courses);
        }).catch((err1: any) => {
            Log.p(err1, "r");
            expect.fail(err1 + " Should not have rejected - remove");
        });
    });

    it("Should successfully reject with none added - remove", function () {
        const id: string = "courses";
        return insightFacade.removeDataset(id).then((result2: string) => {
            expect.fail(result2.toString() + " Should have rejected - remove");
        }).catch((err2: any) => {
            Log.p(err2, "r");
            expect(err2).to.be.instanceOf(NotFoundError);
        });
    });

    it("Should successfully reject null id - remove", function () {
        const id: any = null;
        return insightFacade.removeDataset(id).then((result2: string) => {
            expect.fail(result2.toString() + " Should have rejected - remove");
        }).catch((err2: any) => {
            expect(err2).to.be.instanceOf(InsightError);
        });
    });

    it("Should successfully reject undefined id - remove", function () {
        const id: any = undefined;
        return insightFacade.removeDataset(id).then((result2: string) => {
            expect.fail(result2.toString() + " Should have rejected - remove");
        }).catch((err2: any) => {
            expect(err2).to.be.instanceOf(InsightError);
        });
    });

    // ### list below this ###################################################################
    // ### list below this
    // ### list below this
    // ### list below this
    // ### list below this ###################################################################

    // it("Should handle race conditions - list, useless?", function () {
    //     const id: string = idc;
    //     const expected: InsightDataset[] = [{id: idc, kind: InsightDatasetKind.Courses, numRows: 5944}];
    //     return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
    //         for (let i = 0; i < 256; i++) {
    //             insightFacade.listDatasets().then((result: InsightDataset[]) => {
    //                 expect(result.length).to.deep.equal(expected.length);
    //             }).catch((err: any) => {
    //                 Log.p(`${err}`, "r");
    //                 expect.fail(err + " Should not have rejected - list");
    //             });
    //         }
    //     }).catch((err1: any) => {
    //         Log.p(`${err1}`, "r");
    //         expect.fail(err1 + " Should not have rejected - list");
    //     });
    // });

    it("Should list the current data set - list", function () {
        const id: string = idc;
        const expected: InsightDataset[] = [{id: idc, kind: InsightDatasetKind.Courses, numRows: 99}];
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.listDatasets().then((result: InsightDataset[]) => {
                // Log.p(`${result[0].numRows}`, "y");
                expect(result.length).to.deep.equal(expected.length);
            }).catch((err: any) => {
                Log.p(`${err}`, "r");
                expect.fail(err + " Should not have rejected - list");
            });
        }).catch((err1: any) => {
            Log.p(`${err1}`, "r");
            expect.fail(err1 + " Should not have rejected - list");
        });
    });

    it("Should remain indifferent to result mod - list", function () {
        const id: string = idc;
        const expected: InsightDataset[] = [{id: idc, kind: InsightDatasetKind.Courses, numRows: 99}];
        return insightFacade.addDataset(id, datasets[idc], InsightDatasetKind.Courses).then((result1: string[]) => {
            return insightFacade.listDatasets().then((result2: InsightDataset[]) => {
                result2 = [];
                return insightFacade.listDatasets().then((result3: InsightDataset[]) => {
                    expect(result3).to.deep.equal(expected);
                }).catch((err3: any) => {
                    Log.p(`${err3}`, "r");
                    expect.fail(err3 + " Should not have rejected - list post mod");
                });
            }).catch((err2: any) => {
                Log.p(`${err2}`, "r");
                expect.fail(err2 + " Should not have rejected - list pre mod");
            });
        }).catch((err1: any) => {
            Log.p(`${err1}`, "r");
            expect.fail(err1 + " Should not have rejected - list add");
        });
    });

    it("Should list no datasets - list", function () {
        const expected: InsightDataset[] = [];
        return insightFacade.listDatasets().then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            Log.p(`${err}`, "r");
            expect.fail(err + " Should not have rejected");
        });
    });

    // ### load below this ###################################################################
    // ### load below this
    // ### load below this
    // ### load below this
    // ### load below this ###################################################################

    it("Should load a dataset", function () {
        const id: string = "coursesOne";
        const kind = InsightDatasetKind.Courses;
        const dmgr = new DatasetManager();
        return dmgr.addDataset(id, datasets[id], kind).then((res: string[]) => {
            Log.p(`added: ${res.join(", ")}`, "y");
            return dmgr.loadDataset(id);
        }).then( (save: DatasetSave) => {
            expect(save.name).to.equal(id);
            expect(save.kind).to.equal(kind);
        }).catch((err1: any) => {
            Log.p(`${err1}`, "r");
            expect.fail(err1 + " Should not have rejected - add");
        });
    });

    it(`should handle unexpected save removal`, function (done) {
        const testB: ITestQuery = {
            filename: "for save removal",
            title: "for save removal",
            query: "{\n" +
                "        \"WHERE\": {\n" +
                "            \"GT\": {\n" +
                "                \"toDel_avg\":97\n" +
                "            }\n" +
                "        },\n" +
                "        \"OPTIONS\": {\n" +
                "            \"COLUMNS\": [\n" +
                "                \"toDel_dept\",\n" +
                "                \"toDel_uuid\",\n" +
                "                \"toDel_avg\"\n" +
                "            ],\n" +
                "            \"ORDER\": \"toDel_uuid\"\n" +
                "        }\n" +
                "    }",
            isQueryValid: false,
            result: "InsightError"
        };

        const path = "./data/0.json";
        insightFacade.addDataset(idc, datasets[idc], InsightDatasetKind.Courses).then( () => {
            fs.unlinkSync(path);
        }).then(() => {
            return insightFacade.performQuery(JSON.parse(testB.query));
        }).then((result) => {
            TestUtil.checkQueryResult(testB, result, done);
        }).catch((err) => {
            TestUtil.checkQueryResult(testB, err, done);
            Log.p(`${err}`, "R");
        });
    });

    it("Should gracefully handle https failure - https", function () {
        const locator = new GeoLocator();
        return locator.getLocation("lol").then((result: IGeoResponse) => {
            Log.p(Object.entries(result).map((a) => a.join(":")).join(", "), "y");
            expect.fail(result.toString() + " Should not have passed");
        }).catch((err: any) => {
            Log.p(err, "y");
        });
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: {id: string, path: string, kind: InsightDatasetKind} } = {
        // courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        // rooms: {id: "rooms", path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms},
        // weirdID: {id: weirdID, path: "./test/data/coursesOne.zip", kind: InsightDatasetKind.Courses},
        // coursesOne: {id: "coursesOne", path: "./test/data/coursesOne.zip", kind: InsightDatasetKind.Courses},
        // toDel: {id: "toDel", path: "./test/data/coursesOne.zip", kind: InsightDatasetKind.Courses}
    };
    let insightFacade: InsightFacade = new InsightFacade();
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        this.timeout(300000);
        Log.test(`Before: ${this.test.parent.titlex}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
        }

        // debug hack
        insightFacade.debugMode(true);

        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        this.timeout(120000);
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });

    it(`should reject bad json`, function (done) {
        const test: ITestQuery = {
            filename: "badJSON",
            title: "bad json",
            query: "{\n" +
                "        \"WHERE\": {\n" +
                "            \"GT\": {\n" +
                "                \"courses_avg\": 97\n" +
                "            }\n" +
                "        },\n" +
                "        \"OPTIONS\": {\n" +
                "            \"COLUMNS\": [\n" +
                "                \"courses_dept\",\n" +
                "                \"courses_avg\"\n" +
                "            ],\n" +
                "            \"ORDER\": \"courses_avg\"\n" +
                "        },\n" +
                "    }",
            isQueryValid: false,
            result: "InsightError"
        };
        insightFacade.performQuery(test.query).then((result) => {
            TestUtil.checkQueryResult(test, result, done);
        }).catch((err) => {
            TestUtil.checkQueryResult(test, err, done);
        });
    });
});
