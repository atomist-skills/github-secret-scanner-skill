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

            const result = await scanFileContent(
                "test.md",
                text,
                {globs: undefined,
                    secretDefinitions: [
                            {pattern: "over", description: "over"},
                            {pattern: "green", description: "green"},
                    ],
                    whitelist: []});
            assert.strictEqual(result.length, 3);
        });
    });

});
