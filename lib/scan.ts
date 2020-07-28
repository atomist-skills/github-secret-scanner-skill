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

import { project } from "@atomist/skill";
import * as fs from "fs-extra";
import * as path from "path";
import { SecretDefinition } from "./load";

export const DefaultGlobPatterns = ["**/*"];

export interface ScanConfiguration {
	glob: string[];
	secretDefinitions: SecretDefinition[];
	exceptions: string[];
	pattern?: string[];
	disabled?: string[];
}

export interface Secret {
	value: string;
	path: string;
	startLine: number;
	startOffset: number;
	endLine: number;
	endOffset: number;
	description: string;
	name: string;
}

export async function scanProject(
	p: project.Project,
	cfg: ScanConfiguration,
): Promise<{ fileCount: number; detected: Secret[]; excluded: Secret[] }> {
	const secrets = {
		detected: [],
		excluded: [],
	};
	const files = await project.globFiles(p, cfg?.glob || "**", {
		braceExpansion: true,
	});
	for (const file of files) {
		const content = (await fs.readFile(p.path(file))).toString();
		const scannedSecrets = await scanFileContent(file, content, cfg);
		if (scannedSecrets?.detected?.length > 0) {
			secrets.detected.push(...scannedSecrets.detected);
		}
		if (scannedSecrets?.excluded?.length > 0) {
			secrets.excluded.push(...scannedSecrets.excluded);
		}
	}
	return {
		fileCount: files.length,
		...secrets,
	};
}

export async function scanFileContent(
	filePath: string,
	content: string,
	cfg: ScanConfiguration,
): Promise<{ detected: Secret[]; excluded: Secret[] }> {
	const secrets = {
		detected: [],
		excluded: [],
	};
	for (const sd of cfg.secretDefinitions) {
		if ((cfg.disabled || []).includes(sd.description)) {
			continue;
		}
		const fileName = path.basename(filePath);
		if ((sd.ignore || []).includes(fileName)) {
			continue;
		}
		const regexp = new RegExp(sd.pattern, "g");

		let match;
		do {
			match = regexp.exec(content);
			if (match) {
				const secret = {
					name: sd.description || sd.pattern,
					path: filePath,
					value: match[0],
					description: `${match[0]} detected as ${
						sd.description || "secret"
					}`,
					...extractSourceLocation(match[0], match.index, content),
				};
				if ((cfg.exceptions || []).includes(match[0])) {
					secrets.excluded.push(secret);
				} else {
					secrets.detected.push(secret);
				}
			}
		} while (match);
	}
	return secrets;
}

export function extractSourceLocation(
	match: string,
	index: number,
	content: string,
): {
	startLine: number;
	startOffset: number;
	endLine: number;
	endOffset: number;
} {
	const startLine = (content.slice(0, index).match(/\n/gm) || []).length + 1;
	const endLine =
		startLine +
		(content.slice(index, index + match.length).match(/\n/gm) || []).length;

	let startOffset;
	let endOffset;

	if (startLine === endLine) {
		startOffset = index - content.slice(0, index).lastIndexOf("\n");
		endOffset = startOffset + match.length;
	}
	return {
		startLine,
		startOffset,
		endLine,
		endOffset,
	};
}
