import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';
import { jsonToCsv } from '../libs';

const pdfFile = path.join(
  __dirname,
  '..',
  '..',
  'data',
  '臺南市COVID-19疫苗接種合約醫療院所名冊-1100707更新3.pdf',
);
const textFile = pdfFile.replace('.pdf', '.txt');

// eslint-disable-next-line no-unused-vars
const convertPdfToText = () => {
  const dataBuffer = fs.readFileSync(pdfFile);
  pdf(dataBuffer).then(function (data) {
    // number of pages
    // console.log(data.numpages);
    // number of rendered pages
    // console.log(data.numrender);
    // PDF info
    // console.log(data.info);
    // PDF metadata
    // console.log(data.metadata);
    // PDF.js version
    // check https://mozilla.github.io/pdf.js/getting_started/
    // console.log(data.version);
    // PDF text

    fs.writeFileSync(textFile, data.text);
    // const lines = data.text.split('\n');
    // console.log(lines.map((e, index) => `${index}:${e}`).join('\n'));
  });
};
// convertPdfToText();

const parse = () => {
  const lines = fs.readFileSync(textFile).toString('utf8').split('\n');

  // 臺南市COVID-19疫苗接種合約醫院名冊

  const csvKeys = [
    'city',
    'name',
    'district',
    'address',
    'phone',
    // 'specialty',
    // 'serial',
    // 'note',
    // 'department',
  ];
  // 1. 必要欄位：施打站全稱、施打站縣市、施打站地址
  // 2. 選擇欄位：施打站行政區、施打站地址、官方提供網址、預約電話、醫事機構代碼、施打站經度、施打站緯度
  const csvKeysMap = [
    '施打站縣市',
    '施打站全稱',
    '施打站行政區',
    '施打站地址',
    '預約電話',
    // 'specialty',
    // 'serial',
    // 'note',
    // 'department',
  ];
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('衛生所名冊') !== -1) break;
    if (lines[i].indexOf('專責') !== -1 && lines[i + 1] === '醫院') {
      let j = i;
      const city = '台南市';
      const specialty = lines[i] + lines[i + 1];
      const serial = lines[j + 2];
      const district = lines[j + 3];

      let name = lines[j + 4];
      j = j + 5;
      while (!lines[j].startsWith('台南市') && !lines[j].startsWith('7')) {
        name += lines[j++];
      }

      let address = '';
      let phone = '';
      if (lines[j].indexOf('06-') !== -1) {
        [address, phone] = lines[j].split('06-');
        phone = '06-' + phone;
      } else {
        while (!lines[j].startsWith('06-') && lines[j].indexOf('序號') === -1) {
          address += lines[j++];
        }
        phone = lines[j];
      }

      let department = '';
      let note = '';

      if (lines[i] === '專責') {
        // special case
        if (lines[j] === '序號') {
          department = 'COVID-19疫苗注射門診';
          phone = '06-2705911';
        } else {
          department = lines[j + 1];
          j = j + 2;

          while (
            lines[j] &&
            lines[j].indexOf('專責') === -1 &&
            lines[j].indexOf('序號') === -1
          ) {
            note += lines[j++];
          }
        }
      }

      const result = {
        city,
        specialty,
        serial,
        name,
        district,
        address,
        phone,
        note,
        department,
      };
      results.push(result);
    }
  }
  console.log(JSON.stringify(results, null, 2));
  // console.log(jsonToCsv(csvKeys, csvKeysMap, results).join('\n'));
};

parse();
