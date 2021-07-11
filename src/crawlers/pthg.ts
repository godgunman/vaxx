import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import { getPlaceInfo, jsonToCsv } from '../libs';
import { Place } from '../types';

const xmlFile = path.join(
  __dirname,
  '..',
  '..',
  'data',
  '屏東縣Covid19疫苗施打站.kml',
);

const outputJson = path.join(__dirname, '..', '..', 'output', 'pthg.json');
const outputCsv = path.join(__dirname, '..', '..', 'output', 'pthg.csv');

const data = fs.readFileSync(xmlFile);

xml2js
  .parseStringPromise(data /*, options */)
  .then(async function (result) {
    const city = '屏東縣';
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
    // 1. 必要欄位：施打站全稱、施打站縣市、施打站地址
    // 2. 選擇欄位：施打站行政區、施打站地址、官方提供網址、預約電話、醫事機構代碼、施打站經度、施打站緯度
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
    const results = [];
    const folders = result.kml.Document[0].Folder;

    for (const f of folders) {
      for (const place of f.Placemark) {
        const [lng, lat] = place.Point[0].coordinates[0].trim().split(',');
        const result = {
          city,
          name: place.name[0],
          lng,
          lat,
        };
        let placeInfo = {
          address: '',
          phone: '',
          district: '',
        };
        try {
          placeInfo = await getPlaceInfo(result.name);
        } catch (e) {
          console.error(e);
        }

        results.push({ ...placeInfo, ...result });
      }
    }
    // console.log(results);

    fs.writeFileSync(outputJson, JSON.stringify(results, null, 2));
    fs.writeFileSync(
      outputCsv,
      jsonToCsv(csvKeys, csvKeysMap, results).join('\n'),
    );
    // console.log(JSON.stringify(results, null, 2));
    // console.log(jsonToCsv(csvKeys, csvKeysMap, results).join('\n'));
  })
  .catch(console.error);
