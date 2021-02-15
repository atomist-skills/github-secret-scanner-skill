import { github } from "@atomist/skill";

export async function verify(secret: string): Promise<boolean> {
	const api = github.api({
		credential: { token: secret, scopes: [] },
		apiUrl: "https://api.github.com/",
	});

	try {
		const result = await api.apps.getAuthenticated();
		return result.data?.name !== undefined;
	} catch (e) {
		return false;
	}
}
