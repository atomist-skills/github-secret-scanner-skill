import { CommandHandler } from "@atomist/skill/lib/handler";
import { slackSuccessMessage } from "@atomist/skill/lib/messages";
import { gitHubComRepository } from "@atomist/skill/lib/project";
import { push } from "@atomist/skill/lib/project/git";
import { gitHubAppToken } from "@atomist/skill/lib/secrets";
import {
    bold,
    codeLine,
} from "@atomist/slack-messages";
import { ScanConfiguration } from "../scan";

interface RevertParameters {
    owner: string;
    repo: string;
    apiUrl: string;
    branch: string;
    sha: string;
    msgId: string;
}

export const handler: CommandHandler<ScanConfiguration> = async ctx => {
    const parameters = await ctx.parameters.prompt<RevertParameters>({
        owner: {},
        repo: {},
        apiUrl: {},
        branch: {},
        sha: {},
        msgId: {},
    });

    const credential = await ctx.credential.resolve(gitHubAppToken({
        owner: parameters.owner,
        repo: parameters.repo,
        apiUrl: parameters.apiUrl,
    }));
    const id = gitHubComRepository({
        owner: parameters.owner,
        repo: parameters.repo,
        credential,
        branch: parameters.branch,
        sha: parameters.sha,
    });

    await ctx.audit.log(`Cloned repository ${parameters.owner}/${parameters.repo} at sha ${parameters.sha.slice(0, 7)}`);

    const project = await ctx.project.clone(id, { alwaysDeep: true, detachHead: false });
    await project.exec("git", ["reset", parameters.sha, "--hard"]);
    await project.exec("git",  ["gc", "--prune=now", "--aggressive"]);
    await push(project, { force: true });

    await ctx.audit.log("Successfully reverted repository");

    const msg = slackSuccessMessage(
        "Secret Scanner",
        `Successfully reverted ${bold(`${parameters.owner}/${parameters.repo}/${parameters.branch}`)} to ${codeLine(parameters.sha.slice(0, 7))}`,
        ctx);
    await ctx.message.respond(msg, { id: parameters.msgId });

    return {
        code: 0,
        reason: `Successfully reverted repository ${parameters.owner}/${parameters.repo} to commit ${parameters.sha.slice(0, 7)}`,
    };
};
