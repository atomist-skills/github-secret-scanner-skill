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

import * as github from "@octokit/rest";

export const DefaultGitHubApiUrl = "https://api.github.com/";

export function apiUrl(repo: any): string {
    if (repo.org && repo.org.provider && repo.org.provider.apiUrl) {
        let providerUrl = repo.org.provider.apiUrl;
        if (providerUrl.slice(-1) === "/") {
            providerUrl = providerUrl.slice(0, -1);
        }
        return providerUrl;
    } else {
        return DefaultGitHubApiUrl;
    }
}

export function gitHub(token: string, url: string = DefaultGitHubApiUrl): github {
    return new github({
        auth: `token ${token}`,
        baseUrl: url.endsWith("/") ? url.slice(0, -1) : url,
        throttle: {
            onRateLimit: (retryAfter: any, options: any) => {
                console.warn(`Request quota exhausted for request '${options.method} ${options.url}'`);

                if (options.request.retryCount === 0) { // only retries once
                    console.debug(`Retrying after ${retryAfter} seconds!`);
                    return true;
                }
                return false;
            },
            onAbuseLimit: (retryAfter: any, options: any) => {
                console.warn(`Abuse detected for request '${options.method} ${options.url}'`);
            },
        },
    });
}
