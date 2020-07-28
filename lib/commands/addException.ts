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

import { CommandHandler, guid, slack } from "@atomist/skill";
import * as _ from "lodash";
import { ScanConfiguration } from "../scan";
import {
	SaveSkillConfigurationMutation,
	SaveSkillConfigurationMutationVariables,
} from "../typings/types";

interface AddExceptionParameters {
	config: string;
	value: string;
	msgId: string;
}

export const handler: CommandHandler<ScanConfiguration> = async ctx => {
	const parameters = await ctx.parameters.prompt<AddExceptionParameters>({
		config: {},
		value: {},
		msgId: { required: false },
	});

	const cfg = ctx.configuration.find(c => c.name === parameters.config);
	if (!cfg) {
		return {
			code: 1,
			reason: `Skill configuration not available`,
		};
	}
	await ctx.graphql.mutate<
		SaveSkillConfigurationMutation,
		SaveSkillConfigurationMutationVariables
	>("saveSkillConfiguration.graphql", {
		name: ctx.skill.name,
		namespace: ctx.skill.namespace,
		version: ctx.skill.version,
		config: {
			enabled: true,
			name: cfg.name,
			parameters: [
				{
					stringArray: {
						name: "glob",
						value: cfg.parameters.glob,
					},
				},
				{
					stringArray: {
						name: "pattern",
						value: cfg.parameters.pattern,
					},
				},
				{
					multiChoice: {
						name: "disabled",
						value: cfg.parameters.disabled,
					},
				},
				{
					stringArray: {
						name: "exceptions",
						value: [
							...(cfg.parameters.exceptions || []),
							parameters.value,
						],
					},
				},
				{
					repoFilter: {
						name: "repos",
						value: (cfg.parameters as any).repos,
					},
				},
			],
			resourceProviders: _.map(cfg.resourceProviders, (v, k) => ({
				name: k,
				selectedResourceProviders: v.selectedResourceProviders,
			})),
		},
	});

	await ctx.message.respond(
		slack.successMessage(
			"Secret Scanner",
			`Successfully added \`${parameters.value}\` as exception for configuration _${cfg.name}_`,
			ctx,
		),
		{ id: parameters.msgId || guid() },
	);

	return {
		code: 0,
		reason: `Added \`${parameters.value}\` as exception for configuration _${cfg.name}_`,
	};
};
