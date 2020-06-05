import { CommandHandler } from "@atomist/skill/lib/handler";
import { slackSuccessMessage } from "@atomist/skill/lib/messages";
import { guid } from "@atomist/skill/lib/util";
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
    await ctx.graphql.mutate<SaveSkillConfigurationMutation, SaveSkillConfigurationMutationVariables>(
        "saveSkillConfiguration.graphql",
        {
            name: ctx.skill.name,
            namespace: ctx.skill.namespace,
            version: ctx.skill.version,
            config: {
                enabled: true,
                name: cfg.name,
                parameters: [{
                    stringArray: {
                        name: "glob",
                        value: cfg.parameters.glob,
                    },
                }, {
                    stringArray: {
                        name: "pattern",
                        value: cfg.parameters.pattern,
                    },
                }, {
                    multiChoice: {
                        name: "disabled",
                        value: cfg.parameters.disabled,
                    },
                }, {
                    stringArray: {
                        name: "exceptions",
                        value: [...(cfg.parameters.exceptions || []), parameters.value],
                    },
                }, {
                    repoFilter: {
                        name: "repos",
                        value: (cfg.parameters as any).repos,
                    },
                }],
                resourceProviders: _.map(cfg.resourceProviders, (v, k) => ({ name: k, selectedResourceProviders: v.selectedResourceProviders })),
            },
        });

    await ctx.message.respond(slackSuccessMessage(
        "Secret Scanner",
        `Successfully added \`${parameters.value}\` as exception for configuration _${cfg.name}_`,
        ctx),
        { id: parameters.msgId || guid() });

    return {
        code: 0,
        reason: `Added \`${parameters.value}\` as exception for configuration _${cfg.name}_`,
    };
};
