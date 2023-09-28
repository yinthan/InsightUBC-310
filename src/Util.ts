/* tslint:disable:no-console */

/**
 * Collection of logging methods. Useful for making the output easier to read and understand.
 */
export default class Log {
    public static trace(msg: string): void {
        console.log(`<T> ${new Date().toLocaleString()}: ${msg}`);
    }

    private static getC(c: string): string {
        let col: string;
        c = c.toLowerCase();
        switch (c) {
            case "r":
                col = "31";
                break;
            case "b":
                col = "94";
                break;
            case "y":
                col = "33";
                break;
            case "p":
                col = "95";
                break;
            default:
                col = "30";
                break;
        }

        return col;
    }

    public static p(msg: string, c: string = ""): void {
        let col = this.getC(c);
        console.log(`\x1b[100m\x1b[${col}m%s\x1b[0m`, `<P> ${new Date().toLocaleString()}: ${msg}`);
    }

    public static info(msg: string): void {
        console.info(`<I> ${new Date().toLocaleString()}: ${msg}`, "background: #222; color: #bada55");
    }

    public static warn(msg: string): void {
        console.warn(`<W> ${new Date().toLocaleString()}: ${msg}`);
    }

    public static error(msg: string): void {
        console.error(`<E> ${new Date().toLocaleString()}: ${msg}`);
    }

    public static test(msg: string): void {
        console.log(`<X> ${new Date().toLocaleString()}: ${msg}`);
    }
}
