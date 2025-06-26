import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import minimist from 'minimist';
import prompts from 'prompts';
import pc from 'picocolors';

const {
  blue,
  blueBright,
  cyan,
  green,
  greenBright,
  magenta,
  red,
  redBright,
  reset,
  yellow
} = pc;
const argv = minimist(process.argv.slice(2), {
  default: { help: false },
  alias: { h: "help", t: "template" },
  string: ["_"]
});
const defaultProjectName = "my-vite-project";
const helpMessage = `Usage: create-my-vite-app [OPTION]... [DIRECTORY]

Create a new Vite project in JavaScript or TypeScript.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template

Available templates:
${blueBright("react\u6A21\u677F")}
${greenBright("vue\u6A21\u677F")}
`;
const renameFiles = {
  _gitignore: ".gitignore"
};
function formatTargetDir(targetDir) {
  return targetDir?.trim().replace(/\/+$/g, "");
}
async function init() {
  const help = argv.help || argv.h;
  if (help) {
    console.log(helpMessage);
    return;
  }
  const argTargetDir = formatTargetDir(argv._[0]);
  let targetDir;
  let result;
  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : "text",
          name: "projectName",
          message: reset("\u9879\u76EE\u540D:"),
          initial: defaultProjectName,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultProjectName;
          }
        },
        {
          type: "select",
          name: "template",
          message: "\u8BF7\u9009\u62E9\u9879\u76EE\u6A21\u677F",
          choices: [
            { title: blue("react\u6A21\u677F"), value: "react" },
            { title: yellow("react-ts\u6A21\u677F"), value: "react-ts" },
            { title: greenBright("vue\u6A21\u677F"), value: "vue" },
            { title: cyan("vue-ts\u6A21\u677F"), value: "vue-ts" }
          ]
        }
      ],
      {
        onCancel: () => {
          throw new Error(red("\u2716") + " \u64CD\u4F5C\u53D6\u6D88");
        }
      }
    );
  } catch (e) {
    console.log(e.message);
    return;
  }
  const template = result.template;
  const root = path.join(process.cwd(), targetDir);
  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../..",
    "templates",
    `template-${template}`
  );
  if (fs.existsSync(targetDir)) {
    console.log(pc.red(`\u76EE\u5F55 ${targetDir} \u5DF2\u5B58\u5728\uFF01`));
    process.exit(1);
  }
  fs.mkdirSync(targetDir);
  const write = (file, content = "") => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    console.log(`${magenta(`${targetPath} - \u6587\u4EF6\u521B\u5EFA\u6210\u529F`)}`);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };
  function copy(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      copyDir(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  function copyDir(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
      const srcFile = path.resolve(srcDir, file);
      const destFile = path.resolve(destDir, file);
      copy(srcFile, destFile);
    }
  }
  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== "package.json")) {
    write(file);
  }
  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), "utf-8")
  );
  pkg.name = path.basename(targetDir);
  write("package.json", JSON.stringify(pkg, null, 2) + "\n");
  console.log(pc.green("\u2728 \u9879\u76EE\u521B\u5EFA\u6210\u529F\uFF01"));
  console.log(
    pc.blue(`
  cd ${targetDir}
  npm install`)
  );
}

export { init };
