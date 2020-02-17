import * as assert from "assert";
import { scanFileContent } from "../events/scan";

describe("scan", () => {

    describe("scanFileContent", () => {

        it("should extract correct source location", async () => {

            const text = `The big
brown fox
jumps over the
green fence and
over the lake`;

            const result = await scanFileContent("test.md", text, { parameters: { pattern: ["over", "green"] } } as any);
            assert(result.length === 3);
        });
    });

});
