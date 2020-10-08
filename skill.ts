/*
 * Copyright © 2020 Atomist, Inc.
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
import { loadPattern } from "./lib/load";
import { ScanConfiguration } from "./lib/scan";

async function createSkill(): Promise<SkillInput> {
	return {
		name: "github-secret-scanner-skill",
		namespace: "atomist",
		displayName: "Secret Scanner",
		author: "Atomist",
		categories: [Category.CodeQuality, Category.Security],
		license: "Apache-2.0",

		runtime: {
			memory: 1024,
			timeout: 60,
		},

		resourceProviders: {
			github: resourceProvider.gitHub({ minRequired: 1 }),
			slack: resourceProvider.chat({ minRequired: 0 }),
		},

		parameters: {
			glob: {
				type: ParameterType.StringArray,
				displayName: "Which files to scan",
				description:
					"Add one or more glob patterns. If no glob pattern is entered, the skill will run on all the files in the selected repositories.",
				required: false,
			},
			pattern: {
				type: ParameterType.StringArray,
				displayName: "Secret patterns",
				description:
					"Enter additional secret patterns to scan for as regular expressions.",
				required: false,
			},
			disabled: {
				type: ParameterType.MultiChoice,
				displayName: "Disable secret patterns",
				description:
					"Select patterns that you want to disable for your repositories",
				required: false,
				options: (await loadPattern()).map(s => ({
					text: s.description,
					value: s.description,
				})),
			},
			exceptions: {
				type: ParameterType.StringArray,
				displayName: "Exceptions",
				description:
					"Allow certain matches to be excluded from reporting, e.g. fake secrets in test files.",
				required: false,
			},
			repos: parameter.repoFilter(),
		},
	};
}

export const Skill = skill<ScanConfiguration>(createSkill());
