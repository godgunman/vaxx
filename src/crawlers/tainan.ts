import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';
import { jsonToCsv } from '../libs';

const dataBuffer = fs.readFileSync(
  path.join(
    __dirname,
    '..',
    '..',
    'data',
    '臺南市COVID-19疫苗接種合約醫療院所名冊-1100707更新3.pdf',
  ),
);

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

  const lines = data.text.split('\n');
  // console.log(lines.map((e, index) => `${index}:${e}`).join('\n'));

  // 臺南市COVID-19疫苗接種合約醫院名冊
  let lastHospital = false;
  const csvKeys = [
    'city',
    'specialty',
    'serial',
    'name',
    'district',
    'address',
    'phone',
    'note',
    'department',
  ];
  // 1. 必要欄位：施打站全稱、施打站縣市、施打站地址
  // 2. 選擇欄位：施打站行政區、施打站地址、官方提供網址、預約電話、醫事機構代碼、施打站經度、施打站緯度
  const csvKeysMap = [
    '施打站縣市',
    'specialty',
    'serial',
    '施打站全稱',
    '施打站行政區',
    '施打站地址',
    '預約電話',
    'note',
    'department',
  ];
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('衛生所名冊') !== -1) break;
    if (lines[i].indexOf('專責') !== -1 && lines[i + 1] === '醫院') {
      let j = i;
      const city = '台南市';
      const specialty = lines[i] + lines[i + 1];
      const serial = lines[j + 2];
      if (serial === '25') lastHospital = true;
      const district = lines[j + 3];
      const name = lines[j + 4];
      j = j + 5;
      let address = '';
      while (lines[j].startsWith('06') === false) {
        address += lines[j++];
      }
      const phone = lines[j];

      // 掛號科別
      const department = lines[j + 1];
      j = j + 2;
      let note = '';

      while (lines[j].indexOf('專責') === -1) {
        note += lines[j++];
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
      // console.log(i, result);
    }
    if (lastHospital) break;
  }
  console.log(JSON.stringify(results, null, 2));
  // console.log(jsonToCsv(csvKeys, csvKeysMap, results).join('\n'));
});
