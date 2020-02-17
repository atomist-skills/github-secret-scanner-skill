import { Project } from "@atomist/skill/lib/project";

export interface ScanConfiguration {
    globs: string[];
    pattern: string[];
    whitelist: string[];
}

export interface Secret {
    value: string;
    path: string;
    startLine: number;
    startOffset: number;
    endLine: number;
    endOffset: number;
}

export async function scanProject(project: Project, cfg: ScanConfiguration): Promise<Secret[]> {
    const secrets = [];
    const files = await project.getFiles(cfg?.globs || "**");
    for (const file of files) {
        const content = await file.getContent();
        const exposedSecrets = await scanFileContent(file.path, content, cfg);
        if (exposedSecrets?.length > 0) {
            secrets.push(...exposedSecrets);
        }
    }
    return secrets;
}

export async function scanFileContent(path: string, content: string, cfg: ScanConfiguration): Promise<Secret[]> {
    const exposedSecrets: Secret[] = [];
    for (const sd of cfg.pattern) {
        const regexp = new RegExp(sd, "g");

        let match;
        do {
            match = regexp.exec(content);
            if (!!match) {
                exposedSecrets.push({
                    path,
                    value: match[0],
                    ...extractSourceLocation(match[0], match.index, content),
                });
            }
        } while (!!match);
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
