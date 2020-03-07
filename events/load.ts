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

import * as fs from "fs-extra";
import * as yaml from "js-yaml";
import * as path from "path";

/**
 * Definition of a secret we can find in a project
 */
export interface SecretDefinition {

    /**
     * Regexp for the secret
     */
    pattern: string;

    /**
     * Description of the problem. For example, what kind of secret this is.
     */
    description: string;

    /**
     * File names to ignore when scanning
     */
    ignore: string[];
}

/**
 * Based on regular expressions in https://www.ndss-symposium.org/wp-content/uploads/2019/02/ndss2019_04B-3_Meli_paper.pdf
 */
export async function loadPattern(): Promise<SecretDefinition[]> {
    const secretsYmlPath = path.join(__dirname, "..", "secrets.yaml");
    const yamlString = await fs.readFile(secretsYmlPath);
    const native = await yaml.safeLoad(yamlString.toString());

    const secretDefinitions: SecretDefinition[] = native.secrets
        .map((s: any) => s.secret)
        .map((s: any) => ({
            pattern: s.pattern,
            description: s.description,
            ignore: s.ignore,
        }));

    return secretDefinitions;
}
