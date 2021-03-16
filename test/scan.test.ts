/*
 * Copyright © 2021 Atomist, Inc.
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

import * as assert from "power-assert";

import { loadPattern } from "../lib/load";
import { scanFileContent } from "../lib/scan";

describe("scan", () => {
	describe("scanFileContent", () => {
		it("should extract correct source location", async () => {
			const text = `The big
brown fox
jumps over the
green fence and
over the lake`;

			const result = await scanFileContent("test.md", text, {
				secretDefinitions: [
					{ pattern: "over", description: "over", ignore: [] },
					{ pattern: "green", description: "green", ignore: [] },
				],
				exceptions: [],
			});
			assert.strictEqual(result.detected.length, 3);
			assert.strictEqual(result.excluded.length, 0);
			const e = [
				{
					name: "over",
					path: "test.md",
					value: "over",
					description: "over detected as over",
					startLine: 3,
					startOffset: 7,
					endLine: 3,
					endOffset: 11,
				},
				{
					name: "over",
					path: "test.md",
					value: "over",
					description: "over detected as over",
					startLine: 5,
					startOffset: 1,
					endLine: 5,
					endOffset: 5,
				},
				{
					name: "green",
					path: "test.md",
					value: "green",
					description: "green detected as green",
					startLine: 4,
					startOffset: 1,
					endLine: 4,
					endOffset: 6,
				},
			];
			assert.deepStrictEqual(result.detected, e);
		});

		it("should detect default secrets", async () => {
			const secretDefinitions = await loadPattern();
			const t = `A file with lots of secrets.
https://user:pass@word.com/f?token=0123456789abcdef0123456789abcdef01234567&timeout=90
Some fake AWS key ID is AKIA0123456789ABCDEF.
This 123456789-0123456789abcdefghijklmn0123456789abcdef is not a Twitter token.
You might this this URL 'https://v1.12093847103847561098457012abfcdefab456ef@blah.com/v1/org' contains a GitHub App access token, but you would be wrong.
A Google OAuth token looks like 0123-012345678901234567890123456789_z.apps.googleusercontent.com, but that is not real
and a Google API key has the format AIza0123456789-abcdefghijklmn_pqrstuvwx.
Stripe (sk_live_abcdef012345678998765432) and Picactic (sk_live_abcdef01234567899876543210fedcba) keys are similar.
`;
			const s = await scanFileContent("some.txt", t, {
				secretDefinitions,
				exceptions: [],
			});
			const e = {
				detected: [
					{
						name: "Twitter access token",
						path: "some.txt",
						value:
							"123456789-0123456789abcdefghijklmn0123456789abcdef",
						description:
							"123456789-0123456789abcdefghijklmn0123456789abcdef detected as Twitter access token",
						startLine: 4,
						startOffset: 6,
						endLine: 4,
						endOffset: 56,
					},
					{
						name: "Google API key",
						path: "some.txt",
						value: "AIza0123456789-abcdefghijklmn_pqrstuvwx",
						description:
							"AIza0123456789-abcdefghijklmn_pqrstuvwx detected as Google API key",
						startLine: 7,
						startOffset: 37,
						endLine: 7,
						endOffset: 76,
					},
					{
						name: "Google OAuth ID",
						path: "some.txt",
						value:
							"0123-012345678901234567890123456789_z.apps.googleusercontent.com",
						description:
							"0123-012345678901234567890123456789_z.apps.googleusercontent.com detected as Google OAuth ID",
						startLine: 6,
						startOffset: 33,
						endLine: 6,
						endOffset: 97,
					},
					{
						name: "Picatic API Key",
						path: "some.txt",
						value: "sk_live_abcdef01234567899876543210fedcba",
						description:
							"sk_live_abcdef01234567899876543210fedcba detected as Picatic API Key",
						startLine: 8,
						startOffset: 57,
						endLine: 8,
						endOffset: 97,
					},
					{
						name: "Stripe standard API key",
						path: "some.txt",
						value: "sk_live_abcdef012345678998765432",
						description:
							"sk_live_abcdef012345678998765432 detected as Stripe standard API key",
						startLine: 8,
						startOffset: 9,
						endLine: 8,
						endOffset: 41,
					},
					{
						name: "AWS access key ID",
						path: "some.txt",
						value: "AKIA0123456789ABCDEF",
						description:
							"AKIA0123456789ABCDEF detected as AWS access key ID",
						startLine: 3,
						startOffset: 25,
						endLine: 3,
						endOffset: 45,
					},
					{
						name: "URL with password",
						path: "some.txt",
						value: "https://user:pass@",
						description:
							"https://user:pass@ detected as URL with password",
						startLine: 2,
						startOffset: 1,
						endLine: 2,
						endOffset: 19,
					},
				],
				excluded: [],
			};
			assert.deepStrictEqual(s, e);
		});

		it("should exclude excludes", async () => {
			const secretDefinitions = await loadPattern();
			const t = `A file with lots of secrets.
https://user:pass@word.com/f?token=0123456789abcdef0123456789abcdef01234567&timeout=90
Some fake AWS key ID is AKIA0123456789ABCDEF.
This 123456789-0123456789abcdefghijklmn0123456789abcdef is not a Twitter token.
You might this this URL 'https://v1.12093847103847561098457012abfcdefab456ef@blah.com/v1/org' contains a GitHub App access token, but you would be wrong.
A Google OAuth token looks like 0123-012345678901234567890123456789_z.apps.googleusercontent.com, but that is not real
and a Google API key has the format AIza0123456789-abcdefghijklmn_pqrstuvwx.
Stripe (sk_live_abcdef012345678998765432) and Picactic (sk_live_abcdef01234567899876543210fedcba) keys are similar.
`;
			const s = await scanFileContent("some.txt", t, {
				secretDefinitions,
				exceptions: [
					"https://user:pass@",
					"AKIA0123456789ABCDEF",
					"0123456789abcdef0123456789abcdef01234567",
					"sk_live_abcdef012345678998765432",
				],
			});
			const e = {
				detected: [
					{
						name: "Twitter access token",
						path: "some.txt",
						value:
							"123456789-0123456789abcdefghijklmn0123456789abcdef",
						description:
							"123456789-0123456789abcdefghijklmn0123456789abcdef detected as Twitter access token",
						startLine: 4,
						startOffset: 6,
						endLine: 4,
						endOffset: 56,
					},
					{
						name: "Google API key",
						path: "some.txt",
						value: "AIza0123456789-abcdefghijklmn_pqrstuvwx",
						description:
							"AIza0123456789-abcdefghijklmn_pqrstuvwx detected as Google API key",
						startLine: 7,
						startOffset: 37,
						endLine: 7,
						endOffset: 76,
					},
					{
						name: "Google OAuth ID",
						path: "some.txt",
						value:
							"0123-012345678901234567890123456789_z.apps.googleusercontent.com",
						description:
							"0123-012345678901234567890123456789_z.apps.googleusercontent.com detected as Google OAuth ID",
						startLine: 6,
						startOffset: 33,
						endLine: 6,
						endOffset: 97,
					},
					{
						name: "Picatic API Key",
						path: "some.txt",
						value: "sk_live_abcdef01234567899876543210fedcba",
						description:
							"sk_live_abcdef01234567899876543210fedcba detected as Picatic API Key",
						startLine: 8,
						startOffset: 57,
						endLine: 8,
						endOffset: 97,
					},
				],
				excluded: [
					{
						name: "Stripe standard API key",
						path: "some.txt",
						value: "sk_live_abcdef012345678998765432",
						description:
							"sk_live_abcdef012345678998765432 detected as Stripe standard API key",
						startLine: 8,
						startOffset: 9,
						endLine: 8,
						endOffset: 41,
					},
					{
						name: "AWS access key ID",
						path: "some.txt",
						value: "AKIA0123456789ABCDEF",
						description:
							"AKIA0123456789ABCDEF detected as AWS access key ID",
						startLine: 3,
						startOffset: 25,
						endLine: 3,
						endOffset: 45,
					},
					{
						name: "GitHub personal access or OAuth2 token",
						path: "some.txt",
						value: "0123456789abcdef0123456789abcdef01234567",
						description:
							"0123456789abcdef0123456789abcdef01234567 detected as GitHub personal access or OAuth2 token",
						startLine: 2,
						startOffset: 36,
						endLine: 2,
						endOffset: 76,
					},
					{
						name: "URL with password",
						path: "some.txt",
						value: "https://user:pass@",
						description:
							"https://user:pass@ detected as URL with password",
						startLine: 2,
						startOffset: 1,
						endLine: 2,
						endOffset: 19,
					},
				],
			};
			assert.deepStrictEqual(s, e);
		});

		it("should not detect near-default-secrets", async () => {
			const secretDefinitions = await loadPattern();
			const t = `A file with lots of secrets.
https://user:pa##ss@word.com/f?token=a0123456789abcdef0123456789abcdef01234567&timeout=90
Some fake AWS key ID is AKIA0123456789ABCDEFG.
This 123456789-0123456789abcdefghijklmn0123456789abcdefz is not a Twitter token.
You might this this URL 'https://v1.12093847103847561098457012zbfcdefab456ef@blah.com/v1/org' contains a GitHub App access token, but you would be wrong.
A Google OAuth token looks like 0123-012345678901234567890123456789_z.app.googleusercontent.com, but that is not real
and a Google API key has the format AIza0123456789-abcdefghijklmn_pqrstuvw.
Stripe (sk_live_abcdef01234567899876543) and Picactic (ask_live_abcdef01234567899876543210fedcba) keys are similar.
`;
			const s = await scanFileContent("some.txt", t, {
				secretDefinitions,
				exceptions: [],
			});
			const e = {
				detected: [],
				excluded: [],
			};
			assert.deepStrictEqual(s, e);
		});

		it("should detect pem private key in text", async () => {
			const secretDefinitions = await loadPattern();
			const t = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,FA24A3F52675C4B1

M6tKcQsR2FIt7aSpeTo2tGH91h42wmZ3JfH4cHoNKL1JU5A5HBx49A5i7VmAcwDk
4tnLVKmfTjJIZMTlPpMmR6XQUQeW8N1oYDaS8vEwGkbcDFuwBzvpa2xQuyUfTrZK
HKVPyrfBjp56yiI9ZNjIDLibXwAo6EhV8uHBufx5g0jae3xXZn1FtRQCUepcZ+F6
-----END RSA PRIVATE KEY-----
`;
			const s = await scanFileContent("some.txt", t, {
				secretDefinitions,
				exceptions: [],
			});
			const e = {
				detected: [
					{
						description:
							"-----BEGIN RSA PRIVATE KEY----- detected as PEM Private Key",
						endLine: 8,
						endOffset: undefined,
						name: "PEM Private Key",
						path: "some.txt",
						startLine: 1,
						startOffset: undefined,
						value:
							"-----BEGIN RSA PRIVATE KEY-----\nProc-Type: 4,ENCRYPTED\nDEK-Info: DES-EDE3-CBC,FA24A3F52675C4B1\n\nM6tKcQsR2FIt7aSpeTo2tGH91h42wmZ3JfH4cHoNKL1JU5A5HBx49A5i7VmAcwDk\n4tnLVKmfTjJIZMTlPpMmR6XQUQeW8N1oYDaS8vEwGkbcDFuwBzvpa2xQuyUfTrZK\nHKVPyrfBjp56yiI9ZNjIDLibXwAo6EhV8uHBufx5g0jae3xXZn1FtRQCUepcZ+F6\n-----END RSA PRIVATE KEY-----",
					},
				],
				excluded: [],
			};
			assert.deepStrictEqual(s, e);
		});
	});
});
