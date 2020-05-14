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

import { Project } from "@atomist/skill/lib/project/project";
import { globFiles } from "@atomist/skill/lib/project/util";
import * as fs from "fs-extra";
import * as path from "path";
import { SecretDefinition } from "./load";

export const DefaultGlobPatterns = [
    "**/*",
];

export interface ScanConfiguration {
    glob: string[];
    secretDefinitions: SecretDefinition[];
    whitelist: string[];
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
    name: string
}

export async function scanProject(project: Project, cfg: ScanConfiguration): Promise<{ fileCount: number; secrets: Secret[] }> {
    const secrets = [];
    const files = await globFiles(project, cfg?.glob || "**", { braceExpansion: true });
    for (const file of files) {
        const content = (await fs.readFile(project.path(file))).toString();
        const exposedSecrets = await scanFileContent(file, content, cfg);
        if (exposedSecrets?.length > 0) {
            secrets.push(...exposedSecrets);
        }
    }
    return {
        fileCount: files.length,
        secrets,
    };
}

export async function scanFileContent(filePath: string, content: string, cfg: ScanConfiguration): Promise<Secret[]> {
    const exposedSecrets: Secret[] = [];
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
            if (!!match && !(cfg.whitelist || []).includes(match[0])) {
                exposedSecrets.push({
                    name: sd.description || sd.pattern,
                    path: filePath,
                    value: match[0],
                    description: `${match[0]} detected as ${sd.description || "secret"}`,
                    ...extractSourceLocation(match[0], match.index, content),
                });
            }
        } while (match);
    }
    return exposedSecrets;
}

export function extractSourceLocation(match: string, index: number, content: string): {
    startLine: number;
    startOffset: number;
    endLine: number;
    endOffset: number;
} {
    const startLine = (content.slice(0, index).match(/\n/gm) || []).length + 1;
    const endLine = startLine + (content.slice(index, index + match.length).match(/\n/gm) || []).length;

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
