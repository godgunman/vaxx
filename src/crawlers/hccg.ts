import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { jsonToCsv } from '../libs';
import { Place } from '../types';

const outputJson = path.join(__dirname, '..', '..', 'output', 'hccg.json');
const outputCsv = path.join(__dirname, '..', '..', 'output', 'hccg.csv');

const city = '新竹市';

const parseWix = async (url: string, hasPhone: boolean) => {
  const text = await (await fetch(url)).text();

  const results: Place[] = [];
  const $ = cheerio.load(text);

  const script = $('script').get()[2].children[0].data;
  const data = JSON.parse(
    script.slice(script.indexOf('{'), script.indexOf(';')),
  ).data.csvString;
  const lines = data.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (i === 0) continue;
    if (!lines[i]) break;
    const spLines = lines[i].split(',');
    const name = spLines[0].replace(/\d+\./, '');
    const phone = hasPhone ? spLines[spLines.length - 1] : '';
    const d = lines[i]
      .slice(lines[i].indexOf('"') + 1, lines[i].lastIndexOf('"'))
      .replace(/""/g, '"')
      .trim();
    const json = JSON.parse(d);
    results.push({ city, name, address: json.text.trim(), phone });
    console.log(name);
  }

  return results;
};

const parse = async () => {
  const csvKeys: (keyof Place)[] = ['city', 'name', 'address', 'phone'];

  const results: Place[] = [
    ...(await parseWix(
      'https://wix-visual-data.appspot.com/app/widget?pageId=kadxl&compId=comp-kqsr5qhr&viewerCompId=comp-kqsr5qhr&siteRevision=871&viewMode=site&deviceType=desktop&locale=zh&tz=Asia%2FTaipei&regionalLanguage=zh&width=976&height=516&instance=jn9noEPrXHW3e2lg7UE0oIB83G0WT4Qfuw_l4safPbw.eyJpbnN0YW5jZUlkIjoiMjM4YTgwMTAtNTljZC00N2U5LThhODgtN2I1YWVjNWViNThhIiwiYXBwRGVmSWQiOiIxMzQxMzlmMy1mMmEwLTJjMmMtNjkzYy1lZDIyMTY1Y2ZkODQiLCJtZXRhU2l0ZUlkIjoiYmI4MmU3MWYtZDdmZS00MWMzLWJjMDUtZDU5MWVlZDVkMTg2Iiwic2lnbkRhdGUiOiIyMDIxLTA3LTExVDE3OjU4OjMwLjI5OFoiLCJkZW1vTW9kZSI6ZmFsc2UsImFpZCI6IjM3MGVhYzQxLTZkMzItNGU0MS1hZjA0LWU1MTEyNzdlYTI2NSIsImJpVG9rZW4iOiI5ODA4NjcwZi04ZTMzLTA2MmEtMzY4ZC1hZWNiMDI4YjY0MGMiLCJzaXRlT3duZXJJZCI6Ijc4N2VhYWRlLTQ1YzMtNDFlYS1hYzIwLTc2NzIwZGM1NGZhZiJ9&currency=TWD&currentCurrency=TWD&commonConfig=%7B%22brand%22%3A%22wix%22%2C%22bsi%22%3A%224bd6dacb-ef0c-4fa9-909d-84dd16a3b764%7C1%22%2C%22BSI%22%3A%224bd6dacb-ef0c-4fa9-909d-84dd16a3b764%7C1%22%7D&vsi=cf535cca-a942-4ecf-a280-bc5b0c32e86c',
      false,
    )),
    ...(await parseWix(
      'https://wix-visual-data.appspot.com/app/widget?pageId=kadxl&compId=comp-kqsx9mpm&viewerCompId=comp-kqsx9mpm&siteRevision=871&viewMode=site&deviceType=desktop&locale=zh&tz=Asia%2FTaipei&regionalLanguage=zh&width=975&height=253&instance=jn9noEPrXHW3e2lg7UE0oIB83G0WT4Qfuw_l4safPbw.eyJpbnN0YW5jZUlkIjoiMjM4YTgwMTAtNTljZC00N2U5LThhODgtN2I1YWVjNWViNThhIiwiYXBwRGVmSWQiOiIxMzQxMzlmMy1mMmEwLTJjMmMtNjkzYy1lZDIyMTY1Y2ZkODQiLCJtZXRhU2l0ZUlkIjoiYmI4MmU3MWYtZDdmZS00MWMzLWJjMDUtZDU5MWVlZDVkMTg2Iiwic2lnbkRhdGUiOiIyMDIxLTA3LTExVDE3OjU4OjMwLjI5OFoiLCJkZW1vTW9kZSI6ZmFsc2UsImFpZCI6IjM3MGVhYzQxLTZkMzItNGU0MS1hZjA0LWU1MTEyNzdlYTI2NSIsImJpVG9rZW4iOiI5ODA4NjcwZi04ZTMzLTA2MmEtMzY4ZC1hZWNiMDI4YjY0MGMiLCJzaXRlT3duZXJJZCI6Ijc4N2VhYWRlLTQ1YzMtNDFlYS1hYzIwLTc2NzIwZGM1NGZhZiJ9&currency=TWD&currentCurrency=TWD&commonConfig=%7B%22brand%22%3A%22wix%22%2C%22bsi%22%3A%224bd6dacb-ef0c-4fa9-909d-84dd16a3b764%7C1%22%2C%22BSI%22%3A%224bd6dacb-ef0c-4fa9-909d-84dd16a3b764%7C1%22%7D&vsi=cf535cca-a942-4ecf-a280-bc5b0c32e86c',
      true,
    )),
  ];
  fs.writeFileSync(outputJson, JSON.stringify(results, null, 2));
  fs.writeFileSync(outputCsv, jsonToCsv(csvKeys, results).join('\n'));
};

parse();
