/*
 * Copyright © 2023 Atomist, Inc.
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

import { SubscriptionIncoming } from "@atomist/skill/lib/payload";
import { assertSkill } from "@atomist/skill/lib/test/assert";

describe("ScanOnPush", () => {
	before(function b(this: Mocha.Context): void {
		if (!process.env.API_KEY) {
			this.skip();
		}
	});

	it("should scan with configuration", async () => {
		const event: SubscriptionIncoming = {
			subscription: {
				name: "scan_on_push",
				result: [
					[
						{
							"schema/entity-type": "git/commit",
							"git.commit/sha":
								"42e2d426ce655bbcb28cdafc4c2907ebb7237a47",
							"git.commit/repo": {
								"git.repo/name": "github-secret-scanner-skill",
								"git.repo/default-branch": "main",
								"git.repo/org": {
									"github.org/installation-token":
										"v1.*******************************",
									"git.org/name": "atomist-skills",
									"base-url": "h********************m",
									"git.provider/url": "h****************m",
								},
							},
							"git.commit/author": {
								"git.user/name": "Christian Dupuis",
								"git.user/login": "cdupuis",
								"git.user/emails": [
									{
										"email.email/address":
											"b*************m",
									},
								],
							},
						},
					],
				],
			},
			secrets: [
				{
					uri: "atomist://api-key",
					value: process.env.API_KEY,
				},
			],
			team_name: "atomist-community",
			team_id: "T29E48P34",
			correlation_id: Date.now().toString(),
			skill: {
				namespace: "atomist",
				name: "github-secret-scanner-skill",
				version: "0.1.5-10",
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

		await assertSkill(
			event as any,
			{ audit: { log: async msg => console.log(msg) } } as any,
		);
	}).timeout(20000);
});
