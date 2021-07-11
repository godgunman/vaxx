import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { getPlaceInfo, jsonToCsv } from '../libs';
import { Place } from '../types';

const outputJson = path.join(__dirname, '..', '..', 'output', 'ntpc.json');
const outputCsv = path.join(__dirname, '..', '..', 'output', 'ntpc.csv');

const parse = async () => {
  const text = await (
    await fetch(
      'https://www.health.ntpc.gov.tw/medi/?mode=search&find=COVID-19%E7%96%AB%E8%8B%97',
    )
  ).text();

  const city = '新北市';
  const csvKeys: (keyof Place)[] = [
    'city',
    'name',
    'district',
    'address',
    'phone',
    'lng',
    'lat',
  ];

  const results: Place[] = [];
  const $ = cheerio.load(text);

  const elements: {
    name: string;
    phone: string;
    city: string;
    address: string;
  }[] = [];
  $('#search__result > ul > li.card').each((index, e) => {
    const name = $(e).find('h4').text().replace('\n', '');
    const address = $(e).find('img[alt=地址:]').parent().text().trim();
    const phone = $(e).find('img[alt=電話:]').parent().text().trim();
    const result = { city, name, address, phone };
    elements.push(result);
  });

  for (const e of elements) {
    console.log(e.name);
    let placeInfo = {
      address: '',
      phone: '',
      district: '',
    };
    try {
      placeInfo = await getPlaceInfo(city + e.name);
    } catch (e) {
      console.error(e);
    }
    results.push({ ...placeInfo, ...e });
  }

  fs.writeFileSync(outputJson, JSON.stringify(results, null, 2));
  fs.writeFileSync(outputCsv, jsonToCsv(csvKeys, results).join('\n'));
};

parse();
