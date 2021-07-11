import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { getPlaceInfo, jsonToCsv } from '../libs';
import { Place } from '../types';

const outputJson = path.join(__dirname, '..', '..', 'output', 'penghu.json');
const outputCsv = path.join(__dirname, '..', '..', 'output', 'penghu.csv');

const parse = async () => {
  const text = await (
    await fetch('https://www.penghu.gov.tw/wuhanpneumonia/home.jsp?id=79')
  ).text();

  const city = '澎湖縣';
  const csvKeys = [
    'city',
    'name',
    'district',
    'address',
    'phone',
    'lng',
    'lat',
    // 'specialty',
    // 'serial',
    // 'note',
    // 'department',
  ];

  const csvKeysMap = [
    '施打站縣市',
    '施打站全稱',
    '施打站行政區',
    '施打站地址',
    '預約電話',
    '施打站經度',
    '施打站緯度',
    // 'specialty',
    // 'serial',
    // 'note',
    // 'department',
  ];

  const results: Place[] = [];
  const $ = cheerio.load(text);

  const elements: { name: string; phone: string }[] = [];
  $('#pagecontent > div.editor.clearfix > table > tbody > tr').each(
    (index, e) => {
      const name = $(e).find('td[data-th=院所名稱]').text();
      const phone = $(e)
        .find('td[data-th=預約登記電話]')
        .text()
        .trim()
        .split('\n')
        .map(e => e.trim())
        .join('/');

      if (name && phone) {
        elements.push({ name, phone });
      }
    },
  );

  for (const e of elements) {
    const { name, phone } = e;
    console.log(name, phone);
    let placeInfo = {
      address: '',
      phone: '',
      district: '',
    };
    try {
      placeInfo = await getPlaceInfo(city + name);
    } catch (e) {
      console.error(e);
    }
    results.push({ ...placeInfo, name, phone, city });
  }

  fs.writeFileSync(outputJson, JSON.stringify(results, null, 2));
  fs.writeFileSync(
    outputCsv,
    jsonToCsv(csvKeys, csvKeysMap, results).join('\n'),
  );
};

parse();
