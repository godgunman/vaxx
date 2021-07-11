import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { getPlaceInfo, jsonToCsv } from '../libs';
import { Place } from '../types';

const outputJson = path.join(__dirname, '..', '..', 'output', 'hcshb.json');
const outputCsv = path.join(__dirname, '..', '..', 'output', 'hcshb.csv');

const parse = async () => {
  const text = await (
    await fetch(
      'https://prevention.hcshb.gov.tw/News.aspx?n=959&sms=9955&page=1&PageSize=200',
    )
  ).text();

  const city = '新竹縣';
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

  $(
    '#CCMS_Content > div > div > div > div.area-table.rwd-straight > div > div > div > table > tbody > tr',
  ).each((index, e) => {
    const name = $(e).find('td:eq(0)').text().trim();
    const address = $(e).find('td:eq(1)').text().trim();
    const phone = $(e).find('td:eq(2)').text().trim();
    elements.push({ city, name, address, phone });
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
