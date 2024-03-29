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

import {
	handle,
	log,
	policy,
	slack,
	state,
	status,
	subscription,
} from "@atomist/skill";
import * as _ from "lodash";

import { loadPattern } from "../load";
import { DefaultGlobPatterns, ScanConfiguration, scanProject } from "../scan";

export const handler = handle.transform(
	policy.checkHandler<subscription.datalog.OnPush, ScanConfiguration>({
		id: ctx => ({
			owner: ctx.data.commit.repo.org.name,
			repo: ctx.data.commit.repo.name,
			sha: ctx.data.commit.sha,
			branch: ctx.data.commit.refs?.[0]?.name,
			credential: {
				token: ctx.data.commit.repo.org.installationToken,
				scopes: [],
			},
		}),
		clone: () => ({
			alwaysDeep: false,
			detachHead: true,
		}),
		details: ctx => {
			const globs = ctx.configuration.parameters?.glob || [];
			if (globs.length === 0) {
				globs.push(...DefaultGlobPatterns);
			}

			return {
				check: {
					title: "Secret scanner",
					name: ctx.skill.name,
					includeAnnotations: true,
					includeBadge: true,
					body: `Scanning all files matching the following glob pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
				},
			};
		},
		execute: async ctx => {
			const commit = ctx.data.commit;
			const repo = commit.repo;
			const cfg = ctx.configuration;

			log.info(
				`Starting secret scanning on ${repo.org.name}/${
					repo.name
				}@${commit.sha.slice(0, 7)}`,
			);

			const patterns = await loadPattern();

			const secretDefinitions = [
				...patterns,
				...(cfg.parameters?.pattern?.map(p => ({
					pattern: p,
					description: undefined,
					ignore: [],
				})) || []),
			];
			const globs = cfg.parameters?.glob || [];
			const exceptions = cfg.parameters?.exceptions || [];

			if (globs.length === 0) {
				globs.push(...DefaultGlobPatterns);
			}

			const { verified } = await state.hydrate<{
				verified: Record<string, boolean>;
			}>(cfg.name, ctx, { verified: {} } as any);

			const result = await scanProject(
				ctx.chain.project,
				{
					secretDefinitions: _.uniqBy(secretDefinitions, "pattern"),
					exceptions: _.uniq(exceptions),
					glob: _.uniq(globs),
				},
				verified,
			);

			await state.save({ verified }, cfg.name, ctx);

			if (result.detected.length > 0) {
				log.info(`Scanning repository returned the following ${
					result.detected.length === 1 ? "secret" : "secrets"
				} in ${result.fileCount} scanned ${
					result.fileCount === 1 ? "file" : "files"
				}:
${result.detected
	.map(s => ` - ${s.value}: ${s.description} detected in ${s.path}`)
	.join("\n")}`);

				/* const groupByType = _.map(_.groupBy(result.secrets, "name"), (v, k) => ({
                    text: k,
                    options: _.uniqBy(v, "value").map(s => ({ text: s.value, value: s.value })),
                }));
                const files = _.uniq(result.secrets.map(r => r.path)).sort().map(r => ({ text: r, value: r })); */

				const maxLine = _.maxBy(result.detected, "startLine").startLine;
				const groupByFile = _.map(
					_.groupBy(result.detected, "path"),
					(v, k) => `${slack.bold(
						slack.url(
							`https://github.com/${repo.org.name}/${repo.name}/blob/${commit.sha}/${k}`,
							k,
						),
					)}:
\`\`\`
${v
	.map(s => `${s.startLine.toString().padStart(maxLine, "")}: ${s.value}`)
	.join("\n")}
\`\`\``,
				);

				const msgId = `${ctx.skill.namespace}/${ctx.skill.name}/${repo.org.name}/${repo.name}/${commit.sha}`;
				const msg = slack.warningMessage(
					"Secret Scanner",
					`Scanning ${slack.bold(
						slack.url(
							`https://github.com/${repo.org.name}/${repo.name}`,
							`${repo.org.name}/${repo.name}`,
						),
					)} at ${slack.codeLine(
						slack.url(
							`https://github.com/${repo.org.name}/${repo.name}/commit/${commit.sha}`,
							commit.sha.slice(0, 7),
						),
					)} detected the following ${slack.url(
						ctx.chain.check.data.html_url,
						result.detected.length === 1 ? "secret" : "secrets",
					)} in ${result.fileCount} scanned ${
						result.fileCount === 1 ? "file" : "files"
					}:

${groupByFile.join("\n")}`,
					ctx,
					{
						author_link: log.url(ctx),
						/* actions: [
                            menuForCommand(
                                { text: "Add exception", options: groupByType },
                                "addException",
                                "value",
                                { config: ctx.configuration?.name }),
                            menuForCommand(
                                { text: "Ignore file", options: files },
                                "addIgnore",
                                "value",
                                { config: ctx.configuration?.name }),
                        ], */
					},
				);
				msg.attachments[0].footer = `${slack.footer(
					ctx,
				)} ${slack.separator()} ${slack.url(
					ctx.configuration?.url,
					ctx.configuration?.name,
				)}`;

				if (cfg.parameters.channels?.length > 0) {
					await ctx.message.send(
						msg,
						{
							channels: cfg.parameters.channels.map(
								c => c.channelName,
							),
						},
						{ id: msgId },
					);
				}

				return {
					conclusion: cfg.parameters.failCheck
						? policy.Conclusion.Failure
						: policy.Conclusion.Neutral,
					severity: policy.Severity.High,
					body: `${result.detected.length} secret ${
						result.detected.length === 1
							? "value was"
							: "values were"
					} detected in ${result.fileCount} scanned ${
						result.fileCount === 1 ? "file" : "files"
					}.

Scanned all files that matched the following pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
					annotations: result.detected.map(r => ({
						annotationLevel: "failure",
						path: r.path,
						startLine: r.startLine,
						endLine: r.endLine,
						startColumn: r.startOffset,
						endColumn: r.endOffset,
						title: r.name,
						message: r.description,
						sha: undefined,
					})),
					status: status.success(
						`Found ${result.detected.length} ${
							result.detected.length === 1 ? "secret" : "secrets"
						} in` +
							` [${repo.org.name}/${
								repo.name
							}](https://github.com/${repo.org.name}/${
								repo.name
							}) on commit [${commit.sha.slice(
								0,
								7,
							)}](https://github.com/${repo.org.name}/${
								repo.name
							}/commit/${commit.sha})`,
					),
				};
			} else {
				log.info(`Scanning repository returned no secrets`);
				return {
					conclusion: policy.Conclusion.Success,
					body: `No secrets detected in ${result.fileCount} scanned ${
						result.fileCount === 1 ? "file" : "files"
					}.

Scanned all files that matched the following pattern:

${globs.map(g => ` * \`${g}\``).join("\n")}`,
					status: status.success(
						`Found no secrets in [${repo.org.name}/${
							repo.name
						}](https://github.com/${repo.org.name}/${
							repo.name
						}) on commit [${commit.sha.slice(
							0,
							7,
						)}](https://github.com/${repo.org.name}/${
							repo.name
						}/commit/${commit.sha})`,
					),
				};
			}
		},
	}),
);
