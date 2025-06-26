import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import minimist from "minimist";
import prompts from "prompts";
import pc from "picocolors";

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
  yellow,
} = pc;


const argv = minimist(process.argv.slice(2), {
  default: { help: false },
  alias: { h: "help", t: "template" },
  string: ["_"],
});

//默认项目名
const defaultProjectName = "my-vite-project";

//帮助信息
const helpMessage = `\
Usage: create-my-vite-app [OPTION]... [DIRECTORY]

Create a new Vite project in JavaScript or TypeScript.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template

Available templates:
${blueBright("react模板")}
${greenBright("vue模板")}
`;

//用于替换模版和目标文件夹名称的映射表
const renameFiles = {
  _gitignore: ".gitignore",
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

  //项目名
  let targetDir;
  let result;
  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : "text",
          name: "projectName",
          message: reset("项目名:"),
          initial: defaultProjectName,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultProjectName;
          },
        },
        {
          type: "select",
          name: "template",
          message: "请选择项目模板",
          choices: [
            { title: blue("react模板"), value: "react" },
            { title: yellow("react-ts模板"), value: "react-ts" },
            { title: greenBright("vue模板"), value: "vue" },
            { title: cyan("vue-ts模板"), value: "vue-ts" },
          ],
        },
      ],
      {
        onCancel: () => {
          throw new Error(red("✖") + " 操作取消");
        },
      }
    );
  } catch (e) {
    console.log(e.message);
    return;
  }
  const template = result.template;

  const root = path.join(process.cwd(), targetDir);
  //选择的模版目录路径

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../..",
    "templates",
    `template-${template}`
  );

  if (fs.existsSync(targetDir)) {
    console.log(pc.red(`目录 ${targetDir} 已存在！`));
    process.exit(1);
  }

  fs.mkdirSync(targetDir);

  const write = (file, content = "") => {
    // 获取目标路径
    const targetPath = path.join(root, renameFiles[file] ?? file);
    // 输出文件创建成功的日志
    console.log(`${magenta(`${targetPath} - 文件创建成功`)}`);

    // 如果内容不为空
    if (content) {
      // 将内容写入目标路径
      fs.writeFileSync(targetPath, content);
    } else {
      // 如果内容为空，则复制模板文件到目标路径
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

  //复制文件出了package.json
  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== "package.json")) {
    write(file);
  }

  //复制package.json并且修改name
  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), "utf-8")
  );

  pkg.name = path.basename(targetDir);
  write("package.json", JSON.stringify(pkg, null, 2) + "\n");

  console.log(pc.green("✨ 项目创建成功！"));
  console.log(
    pc.blue(`\n  cd ${targetDir}
  npm install`)
  );
}

export { init };
