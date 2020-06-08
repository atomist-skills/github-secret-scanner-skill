import * as assert from "assert";
import { scanFileContent } from "../lib/scan";

describe("scan", () => {

    describe("scanFileContent", () => {

        it("should extract correct source location", async () => {
            const text = `The big
brown fox
jumps over the
green fence and
over the lake`;

            const result = await scanFileContent(
                "test.md",
                text,
                {
                    glob: undefined,
                    secretDefinitions: [
                        { pattern: "over", description: "over", ignore: [] },
                        { pattern: "green", description: "green", ignore: [] },
                    ],
                    exceptions: [],
                });
            assert.strictEqual(result.detected.length, 3);
        });
    });

});
