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

import {
	Category,
	parameter,
	ParameterType,
	resourceProvider,
	skill,
	SkillInput,
} from "@atomist/skill";
import * as _ from "lodash";

import { loadPattern } from "./lib/load";
import { ScanConfiguration } from "./lib/scan";

async function createSkill(): Promise<SkillInput> {
	return {
		name: "github-secret-scanner-skill",
		namespace: "atomist",
		description:
			"Scan committed code for well-known credentials and secrets",
		displayName: "Secret Scanner",
		categories: [Category.CodeMaintenance, Category.DevSecOps],
		iconUrl:
			"https://raw.githubusercontent.com/atomist-skills/github-secret-scanner-skill/main/docs/images/icon.svg",

		runtime: {
			memory: 1024,
			timeout: 540,
		},

		resourceProviders: {
			github: resourceProvider.gitHub({ minRequired: 1 }),
			slack: resourceProvider.chat({ minRequired: 0 }),
		},

		parameters: {
			failCheck: {
				type: ParameterType.Boolean,
				displayName: "Fail GitHub check",
				description:
					"Set a failed GitHub check when secrets are found or changed; otherwise a neutral check will be set",
				defaultValue: false,
				required: false,
			},
			glob: {
				type: ParameterType.StringArray,
				displayName: "Which files to scan",
				description:
					"Enter the files you want to scan as a glob pattern.",
				required: false,
				defaultValue: ["**/*"],
			},
			pattern: {
				type: ParameterType.StringArray,
				displayName: "Custom secret patterns",
				description:
					"Enter your own patterns to scan for as [regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet). Learn more about how to match your [secret format](https://regex101.com/).",
				required: false,
			},
			disabled: {
				type: ParameterType.MultiChoice,
				displayName: "Disable default secret patterns",
				description:
					"Select the patterns you do not want to scan for from our list of known secrets.",
				required: false,
				options: _.sortBy(
					(await loadPattern()).map(s => ({
						text: s.description,
						value: s.description,
					})),
					"text",
				),
			},
			exceptions: {
				type: ParameterType.StringArray,
				displayName: "Secret values to exclude",
				description:
					"Enter the secret values you want to exclude from reporting.",
				required: false,
			},
			channels: {
				type: ParameterType.ChatChannels,
				displayName: "Chat channels to notify",
				description:
					"Select chat channels that should receive notifications on detected secrets",
				minRequired: 0,
				required: false,
			},
			repos: parameter.repoFilter(),
		},

		datalogSubscriptions: [
			{
				query: "@atomist/skill/on_push",
				name: "scan_on_push",
			},
		],
	};
}

export const Skill = skill<ScanConfiguration>(createSkill());
