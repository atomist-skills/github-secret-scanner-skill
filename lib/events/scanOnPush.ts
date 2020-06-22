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

import { EventHandler, github, repository, secret, slack } from "@atomist/skill";
import { bold, codeLine, url } from "@atomist/slack-messages";
import * as _ from "lodash";
import { loadPattern } from "../load";
import { DefaultGlobPatterns, ScanConfiguration, scanProject } from "../scan";
import { ScanOnPushSubscription } from "../typings/types";

export const handler: EventHandler<ScanOnPushSubscription, ScanConfiguration> = async ctx => {
    const push = ctx.data.Push[0];
    const repo = push.repo;
    const configurations = ctx.configuration || [];
    const start = new Date().toISOString();

    await ctx.audit.log(`Starting secret scanning on ${repo.owner}/${repo.name}`);

    const credential = await ctx.credential.resolve(
        secret.gitHubAppToken({
            owner: repo.owner,
            repo: repo.name,
            apiUrl: repo.org.provider.apiUrl,
        }),
    );
    const id = repository.gitHub({
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
    const exceptions = [];

    configurations.forEach(c => {
        secretDefinitions.push(
            ...(c.parameters?.pattern?.map(p => ({ pattern: p, description: undefined, ignore: [] })) || []),
        );
        globs.push(...(c.parameters?.glob || []));
        exceptions.push(...(c.parameters?.exceptions || []));
    });

    if (globs.length === 0) {
        globs.push(...DefaultGlobPatterns);
    }

    const result = await scanProject(project, {
        secretDefinitions: _.uniqBy(secretDefinitions, "pattern"),
        exceptions: _.uniq(exceptions),
        glob: _.uniq(globs),
    });

    const api = github.api(id);
    if (result.detected.length > 0) {
        await ctx.audit.log(`Scanning repository returned the following ${
            result.detected.length === 1 ? "secret" : "secrets"
        } in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}:
${result.detected.map(s => ` - ${s.value}: ${s.description} detected in ${s.path}`).join("\n")}`);

        const chunks = _.chunk(result.detected, 50);

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
            details_url: ctx.audit.url,
        };

        const check = (
            await api.checks.create({
                ...data,
                output: {
                    title: "Secret Scanner",
                    summary: `${result.detected.length} secret ${
                        result.detected.length === 1 ? "value was" : "values were"
                    } detected in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}.

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
            })
        ).data;

        if (chunks.length > 1) {
            for (const chunk of chunks.slice(1)) {
                await api.checks.update({
                    ...data,
                    check_run_id: check.id,
                    output: {
                        title: "Secret Scanner",
                        summary: `${result.detected.length} secret ${
                            result.detected.length === 1 ? "value was" : "values were"
                        } detected in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}.

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
        /* const groupByType = _.map(_.groupBy(result.secrets, "name"), (v, k) => ({
            text: k,
            options: _.uniqBy(v, "value").map(s => ({ text: s.value, value: s.value })),
        }));
        const files = _.uniq(result.secrets.map(r => r.path)).sort().map(r => ({ text: r, value: r })); */

        const maxLine = _.maxBy(result.detected, "startLine").startLine;
        const groupByFile = _.map(
            _.groupBy(result.detected, "path"),
            (v, k) => `${bold(url(`https://github.com/${repo.owner}/${repo.name}/blob/${push.branch}/${k}`, k))}:
\`\`\`
${v.map(s => `${s.startLine.toString().padStart(maxLine, "")}: ${s.value}`).join("\n")}
\`\`\``,
        );

        const msgId = `${ctx.skill.namespace}/${ctx.skill.name}/${repo.owner}/${repo.name}/${push.after.sha}`;
        const msg = slack.warningMessage(
            "Secret Scanner",
            `Scanning ${bold(url(repo.url, `${repo.owner}/${repo.name}/${push.branch}`))} at ${codeLine(
                url(push.after.url, push.after.sha.slice(0, 7)),
            )} detected the following ${url(check.html_url, result.detected.length === 1 ? "secret" : "secrets")} in ${
                result.fileCount
            } scanned ${result.fileCount === 1 ? "file" : "files"}:

${groupByFile.join("\n")}`,
            ctx,
            {
                author_link: ctx.audit.url,
                /* actions: [
                    menuForCommand(
                        { text: "Add exception", options: groupByType },
                        "addException",
                        "value",
                        { config: ctx.configuration[0].name }),
                    menuForCommand(
                        { text: "Ignore file", options: files },
                        "addIgnore",
                        "value",
                        { config: ctx.configuration[0].name }),
                ], */
            },
        );
        msg.attachments[0].footer = `${slack.footer(ctx)} ${slack.separator()} ${url(
            ctx.configuration[0].url,
            ctx.configuration[0].name,
        )}`;

        const users = _.uniq(
            [push.after.author?.person?.chatId?.screenName, push.after.committer?.person?.chatId?.screenName].filter(
                u => !!u,
            ),
        );
        if (users.length > 0) {
            await ctx.message.send(msg, { channels: [], users }, { id: msgId });
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
            details_url: ctx.audit.url,
            output: {
                title: "Secret Scanner",
                summary: `No secrets detected in ${result.fileCount} scanned ${
                    result.fileCount === 1 ? "file" : "files"
                }.

Scanned all files that matched the following pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
            },
        });
    }

    if (result.excluded?.length > 0) {
        await ctx.audit.log(`Scanning repository returned the following excluded ${
            result.excluded.length === 1 ? "secret" : "secrets"
        } in ${result.fileCount} scanned ${result.fileCount === 1 ? "file" : "files"}:
${result.excluded.map(s => ` - ${s.value}: ${s.description} detected in ${s.path}`).join("\n")}`);
    }

    return {
        code: 0,
        reason:
            `Found ${result.detected.length} ${result.detected.length === 1 ? "secret" : "secrets"} in` +
            ` [${repo.owner}/${repo.name}](${repo.url}) on commit [${push.after.sha.slice(0, 7)}](${push.after.url})`,
    };
};
