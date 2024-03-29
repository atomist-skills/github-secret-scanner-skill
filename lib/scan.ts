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

import { ChatChannelParameterValue, log, project } from "@atomist/skill";
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
	channels?: ChatChannelParameterValue[];
	failCheck?: boolean;
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

/**
 * Scan all files in project matching glob patterns for secrets,
 * returning information about found secrets suitable to annotate a
 * GitHub check.
 */
export async function scanProject(
	p: project.Project,
	cfg: ScanConfiguration,
	verified: Record<string, boolean> = {},
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
		const scannedSecrets = await scanFileContent(
			file,
			content,
			cfg,
			verified,
		);
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

/**
 * Return locations of secrets found in `content` for file `filePath`.
 */
export async function scanFileContent(
	filePath: string,
	content: string,
	cfg: Pick<
		ScanConfiguration,
		"secretDefinitions" | "exceptions" | "disabled"
	>,
	verified: Record<string, boolean> = {},
): Promise<{ detected: Secret[]; excluded: Secret[] }> {
	log.debug(`Scanning file '${filePath}'`);
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
		const regexp = new RegExp(sd.pattern, sd.flags || "g");

		let match: RegExpExecArray;
		do {
			match = regexp.exec(content);
			if (match) {
				const secret = {
					name: sd.description || sd.pattern,
					path: filePath,
					value: match[0],
					description: `${match[0].split("\n")[0]} detected as ${
						sd.description || "secret"
					}`,
					...extractSourceLocation(match[0], match.index, content),
				};
				if ((cfg.exceptions || []).includes(match[0])) {
					secrets.excluded.push(secret);
				} else if (verified[secret.value] !== undefined) {
					if (verified[secret.value]) {
						secrets.detected.push(secret);
					}
				} else if (sd.verify) {
					const result = await (
						await import(`./verify/${sd.verify}`)
					).verify(secret.value);
					verified[secret.value] = !!result;
					if (result) {
						secrets.detected.push(secret);
					}
				} else {
					secrets.detected.push(secret);
				}
			}
		} while (match);
	}
	return secrets;
}

/**
 * Return 1-based location of match suitable for use in a GitHub
 * check.
 */
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

	let startOffset: number;
	let endOffset: number;

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
