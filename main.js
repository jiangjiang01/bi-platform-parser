import neatCsv from 'neat-csv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { checkbox, Separator } from '@inquirer/prompts';

const FILE_PATH = 'files';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, FILE_PATH);

function removeFileExtension(filePath) {
  const parsedPath = path.parse(filePath);
  return parsedPath.name;
}

class DataParser {
  constructor() {
    this.data = [];
  }

  async start() {
    const fileList = this.getFileList();
    const csvFiles = fileList.filter((file) => file.endsWith('.csv'));

    const answer = await checkbox({
      message: '请选择要处理的文件',
      choices: csvFiles.map((file) => {
        const fileName = removeFileExtension(file);
        return {
          name: file,
          value: file,
          checked: fileList.filter((f) => f.includes(fileName)).length === 1,
        };
      }),
    });

    answer.forEach((file) => {
      console.log('start parser file:', file);
      this.parser(file);
      console.log('finish parser file:', file);
    });
  }

  getFileList() {
    const files = fs.readdirSync(filePath);
    return files;
  }

  async parser(file) {
    const start = Date.now();

    await this.readFile(file);
    this.sortList();

    const outputFilePath = removeFileExtension(file);
    this.writeWholeFile(outputFilePath);

    this.writeOperateRecordFile(outputFilePath);

    const end = Date.now();
    console.log('duration:', end - start);
  }

  writeOperateRecordFile(file) {
    const ans = [`### 用户手机号: ${this.data[0].operator_phone} '操作记录:`];
    this.data.forEach((item, index) => {
      ans.push(
        `${index + 1}. 操作时间: ${item.operate_data?.operate_at}, 当前页面:${
          item.operate_page_url
        }, 前置页面:${item.operate_object_name}, 页面参数:${
          item.operate_page_query
        }`
      );
    });
    // console.log('用户手机号:', this.data[0].operator_phone, '操作记录:');
    // console.log(ans);

    fs.writeFileSync(`${FILE_PATH}/${file}_operateRecord.md`, ans.join('\n'));
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(`${FILE_PATH}/${file}`, async (err, res) => {
        if (err) {
          console.error(err);
          return;
        }
        const data = await neatCsv(res);

        data.forEach((item, index) => {
          try {
            const keyName = Object.keys(item)[0];
            const obj = JSON.parse(item[keyName]);
            this.data.push(obj[0]);
          } catch (error) {
            console.log(error);
          }
        });
        console.log('finished read file');
        resolve();
      });
    });
  }

  writeWholeFile(file) {
    fs.writeFileSync(
      `${FILE_PATH}/${file}.json`,
      JSON.stringify(this.data, '', 2)
    );
    console.log('finished write file');
  }

  sortList() {
    this.data.sort(
      (a, b) =>
        new Date(a.operate_at).valueOf() - new Date(b.operate_at).valueOf()
    );
    console.log('finished sort');
  }
}

const dataParser = new DataParser();

dataParser.start();

// dataParser.parser('OperateRecord_Wednesday 2024-07-24 15_44_58.csv');
// dataParser.parser('OperateRecord_Tuesday 2024-07-24 16_14_08.csv');
