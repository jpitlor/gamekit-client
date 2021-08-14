#!/usr/bin/env node
"use strict";
const { Command } = require("commander");
const spawn = require("cross-spawn");
const packageJson = require("../package.json");

const args = process.argv.slice(2);
const program = new Command().version(packageJson.version);

program
  .command("start")
  .description("starts a development server")
  .option("-p, --port <port_number>", "1234")
  .action((options) => {});

program
  .command("build")
  .description("builds a production bundle of your client")
  .action(() => {});

program.parse(args);
