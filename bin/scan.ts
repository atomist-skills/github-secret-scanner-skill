#! /usr/bin/env node
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

// tslint:disable-next-line:no-import-side-effect
import "source-map-support/register";

import * as yargs from "yargs";

void yargs
	.command(
		"scan",
		"Scan a local directory for secrets",
		args =>
			args.options({
				cwd: {
					type: "string",
					alias: "c",
					description: "Working directory",
					demandOption: false,
					default: process.cwd(),
				},
				glob: {
					type: "array",
					alias: "g",
					multiple: true,
					description: "Glob pattern to select files to scan",
					demandOption: false,
					default: [],
				},
				exception: {
					type: "array",
					alias: "e",
					multiple: true,
					description: "Exception to ignore during scanning",
					demandOption: false,
					default: [],
				},
				pattern: {
					type: "array",
					alias: "p",
					multiple: true,
					description:
						"Additional regular expression pattern to detect secrets",
					demandOption: false,
					default: [],
				},
				output: {
					type: "string",
					alias: "o",
					description: "Path and name of output file",
					demandOption: false,
				},
				verbose: {
					type: "boolean",
					alias: "v",
					description: "Enable verbose logging",
					demandOption: false,
					default: false,
				},
			}),
		async argv => {
			const result = await (
				await import("../lib/scripts/scan")
			).scan(argv as any);
			process.exit(result);
		},
	)
	.version(false)
	.strict()
	.help().argv;
