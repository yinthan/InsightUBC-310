import Log from "../Util";

const http = require("http");

export interface IGeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export class GeoLocator {
    private PATHb = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team";
    private TEAM = 116;

    public getLocation(address: string): Promise<IGeoResponse> {
        // Log.p(address, "r");
        while (address.includes(" ")) {
            address = address.replace(" ", "%20");
        }
        // Log.p(address, "R");
        return new Promise((resolve) => {
            http.get(`${this.PATHb}${this.TEAM}/${address}`, (res: any) => {
                res.on("data", (d: Buffer) => {
                    resolve(JSON.parse(d.toString()));
                });
            }).on("error", (e: IGeoResponse) => {
                resolve(e);
            });
        });
    }
}
