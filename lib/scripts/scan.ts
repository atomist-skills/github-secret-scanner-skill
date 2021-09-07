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

import { log, repository } from "@atomist/skill";
import { createProjectLoader } from "@atomist/skill/lib/project/loader";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";

import { loadPattern } from "../load";
import { DefaultGlobPatterns, scanProject } from "../scan";

export async function scan(options: {
	pattern?: string[];
	glob?: string[];
	exception?: string[];
	cwd: string;
	output?: string;
	verbose: boolean;
}): Promise<number> {
	if (!options.verbose) {
		process.env.ATOMIST_LOG_LEVEL = "info";
	}
	log.info(`Starting secret scanning on '${options.cwd}'`);

	const patterns = await loadPattern();

	const secretDefinitions = [
		...patterns,
		...(options.pattern?.map(p => ({
			pattern: p,
			description: undefined,
			ignore: [],
		})) || []),
	];
	const globs = options.glob || [];
	const exceptions = options.exception || [];

	if (globs.length === 0) {
		globs.push(...DefaultGlobPatterns);
	}

	const project = await createProjectLoader().load(
		repository.gitHub({
			owner: "",
			repo: path.basename(options.cwd),
			credential: undefined,
		}),
		options.cwd,
		{ userConfig: false },
	);

	const result = await scanProject(
		project,
		{
			secretDefinitions: _.uniqBy(secretDefinitions, "pattern"),
			exceptions: _.uniq(exceptions),
			glob: _.uniq(globs),
		},
		{},
	);

	const outputFile = options.output || path.join(options.cwd, "secrets.json");
	if (result.detected.length > 0) {
		log.info(`Scanning repository returned the following ${
			result.detected.length === 1 ? "secret" : "secrets"
		} in ${result.fileCount} scanned ${
			result.fileCount === 1 ? "file" : "files"
		}:
${result.detected
	.map(s => ` - ${s.value}: ${s.description} detected in ${s.path}`)
	.join("\n")}`);

		const annotations = result.detected.map(r => ({
			annotationLevel: "failure",
			path: r.path,
			startLine: r.startLine,
			endLine: r.endLine,
			startColumn: r.startOffset,
			endColumn: r.endOffset,
			title: r.name,
			message: r.description,
		}));

		await fs.writeJson(outputFile, annotations, { spaces: 2 });

		return 1;
	} else {
		log.info(`Scanning repository returned no secrets`);
		await fs.writeJson(outputFile, [], {
			spaces: 2,
		});
		return 0;
	}
}
