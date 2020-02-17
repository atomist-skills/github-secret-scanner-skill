import { EventHandler } from "@atomist/skill/lib/handler";
import { gitHubComRepository } from "@atomist/skill/lib/project";
import { gitHubAppToken } from "@atomist/skill/lib/secrets";
import { gitHub } from "./github";
import { loadPattern } from "./load";
import {
    ScanConfiguration,
    scanProject,
    Secret,
} from "./scan";
import { ScanOnPushSubscription } from "./types";

export const handler: EventHandler<ScanOnPushSubscription, ScanConfiguration> = async ctx => {
    const push = ctx.data.Push[0];
    const repo = push.repo;
    const configurations = ctx.configurations || [];
    const start = new Date().toISOString();

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

    const patterns = await loadPattern();

    const result: Secret[] = [];
    for (const configuration of configurations) {
        result.push(...await scanProject(project,
            {
                pattern: [...patterns.map(p => p.pattern), ...(configuration.parameters?.pattern || [])],
                globs: configuration.parameters?.globs || ["**/*"],
                whitelist: configuration.parameters?.whitelist || [],
            }));
    }

    const api = gitHub(credential.token, repo.org.provider.apiUrl);
    if (result.length > 0) {
        await api.checks.create({
            owner: repo.owner,
            repo: repo.name,
            head_sha: push.after.sha,
            conclusion: "action_required",
            status: "completed",
            name: "Secret Scanner",
            external_id: ctx.correlationId,
            body: "Secret values were detected",
            started_at: start,
            completed_at: new Date().toISOString(),
            output: {
                title: "Secrets",
                summary: "Please review the following secrets in the repository files",
                annotations: result.map(r => ({
                    annotation_level: "failure",
                    path: r.path,
                    start_line: r.startLine,
                    end_line: r.endLine,
                    start_offset: r.startOffset,
                    end_offset: r.endOffset,
                    message: `${r.value} appears to be a secret`,
                })),
            },
        });
    } else {
        await api.checks.create({
            owner: repo.owner,
            repo: repo.name,
            head_sha: push.after.sha,
            conclusion: "success",
            status: "completed",
            name: "Secret Scanner",
            external_id: ctx.correlationId,
            body: "No secret values detected",
            started_at: start,
            completed_at: new Date().toISOString(),
        });
    }

    return {
        code: 0,
        reason: `Found ${result.length} in ${repo.owner}/${repo.name}`,
    };
};
