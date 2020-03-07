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

import { EventHandler } from "@atomist/skill/lib/handler";
import { gitHubComRepository } from "@atomist/skill/lib/project";
import { gitHubAppToken } from "@atomist/skill/lib/secrets";
import * as _ from "lodash";
import { gitHub } from "./github";
import { loadPattern } from "./load";
import {
    DefaultGlobPatterns,
    ScanConfiguration,
    scanProject,
} from "./scan";
import { ScanOnPushSubscription } from "./types";

export const handler: EventHandler<ScanOnPushSubscription, ScanConfiguration> = async ctx => {
    const push = ctx.data.Push[0];
    const repo = push.repo;
    const configurations = ctx.configuration || [];
    const start = new Date().toISOString();

    await ctx.audit.log(`Starting secret scanning on ${repo.owner}/${repo.name}`);

    const credential = await ctx.credential.resolve(gitHubAppToken({
        owner: repo.owner,
        repo: repo.name,
        apiUrl: repo.org.provider.apiUrl,
    }));
    const project = await ctx.project.clone(gitHubComRepository({
        owner: repo.owner,
        repo: repo.name,
        credential,
        branch: push.branch,
        sha: push.after.sha,
    }), { alwaysDeep: false, detachHead: true });

    await ctx.audit.log(`Cloned repository ${repo.owner}/${repo.name} at sha ${push.after.sha.slice(0, 7)}`);

    const patterns = await loadPattern();

    const secretDefinitions = [...patterns];
    const globs = [];
    const whitelist = [];

    configurations.forEach(c => {
        secretDefinitions.push(...(c.parameters?.pattern?.map(p => ({ pattern: p, description: undefined, ignore: [] })) || []));
        globs.push(...(c.parameters?.globs || []));
        whitelist.push(...(c.parameters?.whitelist || []));
    });

    if (globs.length === 0) {
        globs.push(...DefaultGlobPatterns);
    }

    const result = await scanProject(project,
        { secretDefinitions: _.uniqBy(secretDefinitions, "pattern"), whitelist: _.uniq(whitelist), globs: _.uniq(globs) });

    const api = gitHub(credential.token, repo.org.provider.apiUrl);
    if (result.secrets.length > 0) {
        await ctx.audit.log(`Scanning repository returned the following secrets in ${result.fileCount} ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}:
${result.secrets.map(s => ` - ${s.value}: ${s.description} detected in ${s.path}`).join("\n")}`);

        const chunks = _.chunk(result.secrets, 50);

        const data: any = {
            owner: repo.owner,
            repo: repo.name,
            head_sha: push.after.sha,
            conclusion: "action_required",
            status: "completed",
            name: "github-secret-scanner-skill",
            external_id: ctx.correlationId,
            started_at: start,
            completed_at: new Date().toISOString(),
        };

        const check = (await api.checks.create({
            ...data,
            output: {
                title: "Detected Secrets",
                summary: `${result.secrets.length} secret ${result.secrets.length === 1 ? "value was" : "values were"} detected in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}.

Scanned all files that matched the following pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
                annotations: chunks[0].map(r => ({
                    annotation_level: "failure",
                    path: r.path,
                    start_line: r.startLine,
                    end_line: r.endLine,
                    start_offset: r.startOffset,
                    end_offset: r.endOffset,
                    message: r.description,
                })),
            },
        })).data;

        if (chunks.length > 1) {
            for (const chunk of chunks.slice(1)) {
                await api.checks.update({
                    ...data,
                    check_run_id: check.id,
                    output: {
                        title: "Detected Secrets",
                        summary: `${result.secrets.length} secret ${result.secrets.length === 1 ? "value was" : "values were"} detected in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}.

Scanned all files that matched the following pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
                        annotations: chunk.map(r => ({
                            annotation_level: "failure",
                            path: r.path,
                            start_line: r.startLine,
                            end_line: r.endLine,
                            start_offset: r.startOffset,
                            end_offset: r.endOffset,
                            message: r.description,
                        })),
                    },
                });
            }
        }

    } else {
        await ctx.audit.log(`Scanning repository returned no secrets`);
        await api.checks.create({
            owner: repo.owner,
            repo: repo.name,
            head_sha: push.after.sha,
            conclusion: "success",
            status: "completed",
            name: "github-secret-scanner-skill",
            external_id: ctx.correlationId,
            started_at: start,
            completed_at: new Date().toISOString(),
            output: {
                title: "Detected Secrets",
                summary: `No secrets detected in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}.

Scanned all files that matched the following pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
            },
        });
    }

    return {
        code: result.secrets.length === 0 ? 0 : 1,
        reason: `Found ${result.secrets.length} ${result.secrets.length === 1 ? "secret" : "secrets"} in`
            + ` [${repo.owner}/${repo.name}](${repo.url}) on commit ${push.after.sha}`,
    };
};
