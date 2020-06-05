import {
    gitHubResourceProvider,
    slackResourceProvider,
} from "@atomist/skill/lib/resource_providers";
import {
    DispatchStyle,
    ParameterType,
    repoFilter,
    skill,
    SkillInput,
} from "@atomist/skill/lib/skill";
import { loadPattern } from "./lib/load";
import { ScanConfiguration } from "./lib/scan";

async function createSkill(): Promise<SkillInput> {
    return {

        runtime: {
            memory: 1024,
            timeout: 60,
        },

        dispatchStyle: DispatchStyle.Single,

        resourceProviders: {
            github: gitHubResourceProvider({ minRequired: 1 }),
            slack: slackResourceProvider({ minRequired: 0 }),
        },

        parameters: {
            glob: {
                type: ParameterType.StringArray,
                displayName: "Which files to scan",
                description: "Add one or more glob patterns. If no glob pattern is entered, the skill will run on all the files in the selected repositories.",
                required: false,
            },
            pattern: {
                type: ParameterType.StringArray,
                displayName: "Secret patterns",
                description: "Enter additional secret patterns to scan for as regular expressions.",
                required: false,
            },
            disabled: {
                type: ParameterType.MultiChoice,
                displayName: "Disable secret patterns",
                description: "Select patterns that you want to disable for your repositories",
                required: false,
                options: (await loadPattern()).map(s => ({ text: s.description, value: s.description })),
            },
            exceptions: {
                type: ParameterType.StringArray,
                displayName: "Exceptions",
                description: "Allow certain matches to be excluded from reporting, e.g. fake secrets in test files.",
                required: false,
            },
            repos: repoFilter(),
        },

        subscriptions: [
            "file://graphql/subscription/*.graphql",
        ]

    }
}

export const Skill = skill<ScanConfiguration>(createSkill());

