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

import { menuForCommand } from "@atomist/skill/lib/button";
import { EventHandler } from "@atomist/skill/lib/handler";
import {
    slackFooter,
    slackSeparator,
    slackWarningMessage,
} from "@atomist/skill/lib/messages";
import { gitHubComRepository } from "@atomist/skill/lib/project";
import { gitHub } from "@atomist/skill/lib/project/github";
import { gitHubAppToken } from "@atomist/skill/lib/secrets";
import {
    bold,
    codeLine,
    url,
} from "@atomist/slack-messages";
import * as _ from "lodash";
import { loadPattern } from "../load";
import {
    DefaultGlobPatterns,
    ScanConfiguration,
    scanProject,
} from "../scan";
import { ScanOnPushSubscription } from "../typings/types";

export const handler: EventHandler<ScanOnPushSubscription, ScanConfiguration> = async ctx => {
    const push = ctx.event.Push[0];
    const repo = push.repo;
    const configurations = ctx.configuration || [];
    const start = new Date().toISOString();

    await ctx.audit.log(`Starting secret scanning on ${repo.owner}/${repo.name}`);

    const credential = await ctx.credential.resolve(gitHubAppToken({
        owner: repo.owner,
        repo: repo.name,
        apiUrl: repo.org.provider.apiUrl,
    }));
    const id = gitHubComRepository({
        owner: repo.owner,
        repo: repo.name,
        credential,
        branch: push.branch,
        sha: push.after.sha,
    });
    const project = await ctx.project.clone(id, { alwaysDeep: false, detachHead: true });

    await ctx.audit.log(`Cloned repository ${repo.owner}/${repo.name} at sha ${push.after.sha.slice(0, 7)}`);

    const patterns = await loadPattern();

    const secretDefinitions = [...patterns];
    const globs = [];
    const whitelist = [];

    configurations.forEach(c => {
        secretDefinitions.push(...(c.parameters?.pattern?.map(p => ({ pattern: p, description: undefined, ignore: [] })) || []));
        globs.push(...(c.parameters?.glob || []));
        whitelist.push(...(c.parameters?.whitelist || []));
    });

    if (globs.length === 0) {
        globs.push(...DefaultGlobPatterns);
    }

    const result = await scanProject(project,
        { secretDefinitions: _.uniqBy(secretDefinitions, "pattern"), whitelist: _.uniq(whitelist), glob: _.uniq(globs) });

    const api = gitHub(id);
    if (result.secrets.length > 0) {
        await ctx.audit.log(`Scanning repository returned the following ${result.secrets.length === 1 ? "secret" : "secrets"} in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}:
${result.secrets.map(s => ` - ${s.value}: ${s.description} detected in ${s.path}`).join("\n")}`);

        const chunks = _.chunk(result.secrets, 50);

        const data: any = {
            owner: repo.owner,
            repo: repo.name,
            head_sha: push.after.sha, // eslint-disable-line @typescript-eslint/camelcase
            conclusion: "action_required",
            status: "completed",
            name: "github-secret-scanner-skill",
            external_id: ctx.correlationId, // eslint-disable-line @typescript-eslint/camelcase
            started_at: start, // eslint-disable-line @typescript-eslint/camelcase
            completed_at: new Date().toISOString(), // eslint-disable-line @typescript-eslint/camelcase
            details_url: ctx.audit.url, // eslint-disable-line @typescript-eslint/camelcase
        };

        const check = (await api.checks.create({
            ...data,
            output: {
                title: "Detected Secrets",
                summary: `${result.secrets.length} secret ${result.secrets.length === 1 ? "value was" : "values were"} detected in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}.

Scanned all files that matched the following pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
                annotations: chunks[0].map(r => ({
                    annotation_level: "failure", // eslint-disable-line @typescript-eslint/camelcase
                    path: r.path,
                    start_line: r.startLine, // eslint-disable-line @typescript-eslint/camelcase
                    end_line: r.endLine, // eslint-disable-line @typescript-eslint/camelcase
                    start_offset: r.startOffset, // eslint-disable-line @typescript-eslint/camelcase
                    end_offset: r.endOffset, // eslint-disable-line @typescript-eslint/camelcase
                    message: r.description,
                })),
            },
        })).data;

        if (chunks.length > 1) {
            for (const chunk of chunks.slice(1)) {
                await api.checks.update({
                    ...data,
                    check_run_id: check.id, // eslint-disable-line @typescript-eslint/camelcase
                    output: {
                        title: "Detected Secrets",
                        summary: `${result.secrets.length} secret ${result.secrets.length === 1 ? "value was" : "values were"} detected in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}.

Scanned all files that matched the following pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
                        annotations: chunk.map(r => ({
                            annotation_level: "failure", // eslint-disable-line @typescript-eslint/camelcase
                            path: r.path,
                            start_line: r.startLine, // eslint-disable-line @typescript-eslint/camelcase
                            end_line: r.endLine, // eslint-disable-line @typescript-eslint/camelcase
                            start_offset: r.startOffset, // eslint-disable-line @typescript-eslint/camelcase
                            end_offset: r.endOffset, // eslint-disable-line @typescript-eslint/camelcase
                            message: r.description,
                        })),
                    },
                });
            }
        }
        const groupByType = _.map(_.groupBy(result.secrets, "name"), (v, k) => ({
            text: k,
            options: _.uniqBy(v, "value").map(s => ({ text: s.value, value: s.value })),
        }));
        const maxLine = _.maxBy(result.secrets, "startLine").startLine;
        const groupByFile = _.map(_.groupBy(result.secrets, "path"), (v, k) => (`${bold(url(`https://github.com/${repo.owner}/${repo.name}/blob/${push.branch}/${k}`, k))}:
\`\`\`
${v.map(s => `${s.startLine.toString().padStart(maxLine, "")}: ${s.value}`).join("\n")}
\`\`\``));
        const files = _.uniq(result.secrets.map(r => r.path)).sort().map(r => ({ text: r, value: r }));
        const msgId = `${ctx.skill.namespace}/${ctx.skill.name}/${repo.owner}/${repo.name}/${push.after.sha}`;
        const msg = slackWarningMessage(
            "Secret Scanner",
            `Scanning ${bold(url(repo.url, `${repo.owner}/${repo.name}/${push.branch}`))} at ${codeLine(url(push.after.url, push.after.sha.slice(0, 7)))} detected the following ${result.secrets.length === 1 ? "secret" : "secrets"} in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}:

${groupByFile.join("\n")}`,
            ctx,
            {
                author_link: ctx.audit.url,
                actions: [
                    menuForCommand(
                        { text: "Add to whitelist", options: groupByType },
                        "addWhitelist",
                        "value",
                        { config: ctx.configuration[0].name }),
                    menuForCommand(
                        { text: "Ignore file", options: files },
                        "addIgnore",
                        "value",
                        { config: ctx.configuration[0].name }),
                ],
            });
        msg.attachments[0].footer = `${slackFooter(ctx)} ${slackSeparator()} ${url(ctx.configuration[0].url, ctx.configuration[0].name)}`;
        msg.attachments[0].footer_icon = "https://raw.githubusercontent.com/primer/octicons/master/icons/shield-lock.svg";

        if (push.repo.channels.length > 0) {
            await ctx.message.send(msg, { channels: push.repo.channels.map(c => c.name), users: [] }, { id: msgId});
        } else if (push.after.author?.person?.chatId?.screenName) {
            await ctx.message.send(msg, { channels: [], users: [push.after.author.person.chatId.screenName] }, { id: msgId});
        }

    } else {
        await ctx.audit.log(`Scanning repository returned no secrets`);
        await api.checks.create({
            owner: repo.owner,
            repo: repo.name,
            head_sha: push.after.sha, // eslint-disable-line @typescript-eslint/camelcase
            conclusion: "success",
            status: "completed",
            name: "github-secret-scanner-skill",
            external_id: ctx.correlationId, // eslint-disable-line @typescript-eslint/camelcase
            started_at: start, // eslint-disable-line @typescript-eslint/camelcase
            completed_at: new Date().toISOString(), // eslint-disable-line @typescript-eslint/camelcase
            output: {
                title: "Detected Secrets",
                summary: `No secrets detected in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}.

Scanned all files that matched the following pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
            },
        });
    }

    return {
        code: 0,
        reason: `Found ${result.secrets.length} ${result.secrets.length === 1 ? "secret" : "secrets"} in`
            + ` [${repo.owner}/${repo.name}](${repo.url}) on commit [${push.after.sha.slice(0, 7)}](${push.after.url})`,
    };
};
