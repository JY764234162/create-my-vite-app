// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import minimist from 'minimist';
// import prompts from 'prompts';
// import pc from 'picocolors';

const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');
const minimist = require('minimist');
const prompts = require('prompts');
const pc = require('picocolors');

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

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

const argv = minimist(process.argv.slice(2), {
  default: { help: false },
  alias: { h: 'help', t: 'template' },
  string: ['_'],
});

//默认项目名
const defaultProjectName = 'my-vite-project';

//帮助信息
const helpMessage = `\
Usage: create-my-vite-app [OPTION]... [DIRECTORY]

Create a new Vite project in JavaScript or TypeScript.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template

Available templates:
${blueBright('react模板')}
${greenBright('vue模板')}
`;

//用于替换模版和目标文件夹名称的映射表
const renameFiles = {
  _gitignore: '.gitignore',
};

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
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: reset('Project name:'),
          initial: defaultProjectName,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultProjectName;
          },
        },
        {
          type: 'select',
          name: 'template',
          message: '请选择项目模板',
          choices: [
            { title: blueBright('react模板'), value: 'react' },
            { title: greenBright('vue模板'), value: 'vue' },
          ],
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' 操作取消');
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
  const templateDir = path.join(__dirname, 'templates', `template-${template}`);

  if (fs.existsSync(targetDir)) {
    console.log(pc.red(`目录 ${targetDir} 已存在！`));
    process.exit(1);
  }

  fs.mkdirSync(targetDir);

  const write = (file, content) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    console.log(`${magenta(`${targetPath} - 文件创建成功`)}`);

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

  //复制文件出了package.json
  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file);
  }

  //复制package.json并且修改name
  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8')
  );

  pkg.name = path.basename(targetDir);
  write('package.json', JSON.stringify(pkg, null, 2) + '\n');

  console.log(pc.green('✨ 项目创建成功！'));
  console.log(
    pc.blue(`\n  cd ${targetDir}
  npm install`)
  );
}

function formatTargetDir(targetDir) {
  return targetDir?.trim().replace(/\/+$/g, '');
}

exports.init = init;
