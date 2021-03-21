/*
 * Copyright © 2021 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createContext } from "@atomist/skill/lib/context";
import { EventIncoming } from "@atomist/skill/lib/payload";

import { handler } from "../lib/events/scan_on_push";

describe("ScanOnPush", () => {
	before(function b(this: Mocha.Context): void {
		if (!process.env.API_KEY) {
			this.skip();
		}
	});

	it("should scan with configuration", async () => {
		const push: ScanOnPushSubscription = {
			Push: [
				{
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
				},
			],
		} as any;

		const event: EventIncoming = {
			data: push,
			secrets: [
				{
					uri: "atomist://api-key",
					value: process.env.API_KEY,
				},
			],
			extensions: {
				operationName: "ScanOnPush",
				team_name: "atomist-community",
				team_id: "T29E48P34",
				correlation_id: Date.now().toString(),
			},
			skill: {
				configuration: {
					instances: [
						{
							name: "default",
							parameters: [
								{
									name: "globs",
									value: ["**/*"],
								},
							],
						},
					],
				},
			},
		} as any;

		const context = createContext(event, {} as any) as any;
		context.audit = {
			log: async (): Promise<void> => {
				// Intentionally left empty
			},
		};
		await handler(context);
	}).timeout(20000);
});
