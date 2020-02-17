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
}

/**
 * Based on regular expressions in https://www.ndss-symposium.org/wp-content/uploads/2019/02/ndss2019_04B-3_Meli_paper.pdf
 */
export async function loadPattern(): Promise<SecretDefinition[]> {
    const secretsYmlPath = path.join(__dirname, "..", "secrets.yaml");
    const yamlString = fs.readFile(secretsYmlPath);
    try {
        const native = await yaml.safeLoad(yamlString);

        const secretDefinitions: SecretDefinition[] = native.secrets
            .map((s: any) => s.secret)
            .map((s: any) => ({
                pattern: s.pattern,
                description: s.description,
            }));

        return secretDefinitions;
    } catch (err) {
        throw new Error(`Unable to parse secrets.yml: ${err.message}`);
    }
}
