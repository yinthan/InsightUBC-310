import {mkdir} from "fs";
import {isNegativeNumberLiteral} from "tslint";

export class Sorter {
    public quickSort(arr: any[], leftOri: number, rightOri: number, k: string[]): void {
        let sections: Array<{l: number, r: number, d: number}> = [];
        sections.push({l: leftOri, r: rightOri, d: 0});
        while (sections.length > 0) {
            let section = sections.pop();
            let left = section.l;
            let right = section.r;
            let depth = section.d;

            if (depth >= k.length) {    // no tie breaker
                continue;
            }

            this.qs(arr, left, right, k, depth);   // sort at depth

            let sample;
            let start = left, end;
            let diff = false;
            for (let i = left; i <= right; i++) {       // find tied sections
                let curr = arr[i][k[depth]];
                if (sample !== curr) {
                    diff = true;
                    sample = curr;
                    end = i - 1;

                    if (end - start > 0) {
                        sections.push({l: start, r: end, d: depth + 1});
                    }
                    start = i;
                }
            }
            if (right - start > 0 && diff) {
                sections.push({l: start, r: right, d: depth + 1});
            }
        }
    }

    private qs(arr: any[], leftOri: number, rightOri: number, k: string[], depth: number): void {
        // Log.p(`${l} : ${left} : ${right}`, "r");
        let sections: Array<{left: number, right: number}> = [];
        sections.push({left: leftOri, right: rightOri});

        while (sections.length > 0) {
            // Log.p(`${lefts}`, "r");
            let section = sections.pop();
            let left: number = section.left;
            let right: number = section.right;

            let l = right - left + 1;
            if (l <= 1) {               // 1 or 0 element array
                continue;
            }

            let piv = right;
            let wall = left;
            for (let i = right - 1; i >= wall; i--) {
                if (i === wall) {
                    if (arr[wall][k[depth]] > arr[piv][k[depth]]) {
                        this.swap(arr, wall, piv);
                    }
                    break;
                }

                if (arr[i][k[depth]] < arr[piv][k[depth]]) {
                    this.swap(arr, i, wall);
                    wall++;
                    i++;
                }
            }

            sections.push({left: left, right: wall});
            sections.push({left: wall + 1, right: right});
        }
    }

    private swap(arr: any[], m: number, n: number) {
        let temp = arr[m];
        arr[m] = arr[n];
        arr[n] = temp;
    }
}
