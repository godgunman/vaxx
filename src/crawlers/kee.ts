import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { getPlaceInfo, jsonToCsv } from '../libs';
import { Place } from '../types';

const city = '基隆市';
const code = 'kee';

const outputJson = path.join(__dirname, '..', '..', 'output', code + '.json');
const outputCsv = path.join(__dirname, '..', '..', 'output', code + '.csv');

const parse = async () => {
  const text = await (
    await fetch('https://www.klchb.klcg.gov.tw/tw/klchb/1361-106887.html')
  ).text();

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
    city: string;
    district: string;
    address: string;
  }[] = [];

  const selector = 'table > tbody > tr';

  // console.log($(selector).text());

  $(selector).each((index, e) => {
    const td = $(e).find('td');
    if (td.length === 9 && td.text().indexOf('編號') === -1) {
      elements.push({
        name:
          td
            .eq(3)
            .html()
            ?.replace(/<span.*<\/span>/g, '') ?? '',
        city,
        district: td.eq(1).text(),
        address: td.eq(7).text(),
      });
    }
  });

  console.log(elements);

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
