import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { jsonToCsv } from '../libs';
import { Place } from '../types';

const outputJson = path.join(__dirname, '..', '..', 'output', 'hl.json');
const outputCsv = path.join(__dirname, '..', '..', 'output', 'hl.csv');

const parse = async () => {
  const text = await (
    await fetch('https://www.cdc.gov.tw/Category/MPage/ExAEg6nwwlcJF750v2v1lQ')
  ).text();

  const city = '花蓮縣';
  const csvKeys: (keyof Place)[] = [
    'city',
    'name',
    'district',
    'address',
    'phone',
  ];

  const results: Place[] = [];
  const $ = cheerio.load(text);

  $('#accordion > div.panel').each((index, e) => {
    const text = $(e).find('div.panel-body').text().trim();
    const name = text.match(/醫療院所名稱：(.*)/)?.[1]?.trim() ?? '';
    const district = text.match(/鄉鎮市區：(.*)/)?.[1]?.trim() ?? '';
    const address = text.match(/地址：(.*)/)?.[1]?.trim() ?? '';
    const phone = text.match(/(預約電話|洽詢電話)：(.*)/)?.[2]?.trim() ?? '';
    results.push({ city, name, district, address, phone });
    console.log(index, name, phone);
  });
  fs.writeFileSync(outputJson, JSON.stringify(results, null, 2));
  fs.writeFileSync(outputCsv, jsonToCsv(csvKeys, results).join('\n'));
};

parse();
