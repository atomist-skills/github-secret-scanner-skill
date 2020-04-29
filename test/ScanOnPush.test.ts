import { createContext } from "@atomist/skill/lib/context";
import { EventIncoming } from "@atomist/skill/lib/payload";
import { handler } from "../events/ScanOnPush";
import { ScanOnPushSubscription } from "../events/types";

describe("ScanOnPush", () => {

    before(() => {
        if (!process.env.API_KEY) {
            this.skip();
        }
    });

    it("should scan with configuration", async () => {

        const push: ScanOnPushSubscription = {
            Push: [{
                after: {
                    sha: "1f2606e45ee162583b63d1498e0f97390140888d",
                },
                repo: {
                    name: "sdm",
                    owner: "atomist",
                    org: {
                        provider: {
                            apiUrl: "https://api.github.com/",
                        },
                    },
                },
            }],
        };

        const event: EventIncoming = {
            data: push,
            secrets: [{
                uri: "atomist://api-key",
                value: process.env.API_KEY,
            }],
            extensions: {
                operationName: "ScanOnPush",
                team_name: "atomist-community", // eslint-disable-line @typescript-eslint/camelcase
                team_id: "T29E48P34", // eslint-disable-line @typescript-eslint/camelcase
                correlation_id: Date.now().toString(), // eslint-disable-line @typescript-eslint/camelcase
            },
            skill: {
                configuration: {
                    instances: [{
                        name: "default",
                        parameters: [{
                            name: "globs",
                            value: ["**/*"],
                        }],
                    }],
                },
            },
        } as any;

        const context = createContext(event, {} as any) as any;
        (context).audit = {
            log: async (): Promise<void> => {
                // Intentionally left empty
            },
        };
        await handler(context);
    }).timeout(20000);

});
