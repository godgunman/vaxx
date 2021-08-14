import _ from 'lodash';
import Airtable from 'airtable';
import fs from 'fs';
import { AIRTABLE_API_KEY } from './constants';
import { getPlaceInfo } from './libs';
import {
  AirtableKeyMappingRow,
  AirtableRow,
  AnyObject,
  GooglePlace,
} from './types';

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(
  'appwPM9XFr1SSNjy4',
);

const cachedPath = 'data/airtable_stops_cached.json';
const placeCachedPath = 'data/places_cached.json';

export const fetchAll = async (): Promise<AirtableKeyMappingRow> => {
  // eslint-disable-next-line no-unused-vars
  const data: AirtableKeyMappingRow = {};
  let exploitResolve: (value: AirtableKeyMappingRow) => void | undefined;
  let exploitReject: (error: any) => void | undefined;

  const promise = new Promise(
    (resolve: (value: AirtableKeyMappingRow) => void, reject) => {
      exploitResolve = resolve;
      exploitReject = reject;
    },
  );

  base('施打點清單')
    .select({
      view: 'raw data',
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
          const recordJson = record._rawJson;
          data[recordJson.id] = recordJson;

          console.log(
            `Retrieved [${Object.keys(data).length + 1}]`,
            record.get('施打站全稱（自動）'),
          );
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          exploitReject(err);
        } else {
          exploitResolve(data);
        }
      },
    );
  return promise;
};

export const createCached = async () => {
  const data = await fetchAll();
  console.log(`${Object.keys(data).length} rows`);
  fs.writeFileSync(cachedPath, JSON.stringify(data, null, 2));
};

export const createGooglePlacesCache = async () => {
  const data = loadCache();
  const places: { [key: string]: Partial<GooglePlace> } = {};
  console.log(`${Object.keys(data).length} rows`);

  const chunkSize = 50;
  const chunkData = _.chunk(Object.entries(data), chunkSize);

  for (const part of chunkData) {
    const promises = part.map(async ([key, value]) => {
      // "施打站全稱（自動）": "衛生福利部基隆醫院",
      // "施打站縣市（自動）": "基隆市",

      const searchName =
        value.fields['施打站縣市（自動）'] +
        ' ' +
        value.fields['施打站全稱（自動）'];
      console.log('getPlaceInfo', searchName);

      places[key] = { searchName };

      try {
        Object.assign(places[key], await getPlaceInfo(searchName));
      } catch (e) {
        console.error(searchName, e);
      }
    });

    await Promise.all(promises);
  }

  fs.writeFileSync(placeCachedPath, JSON.stringify(places, null, 2));
};

export const repairPlacesCache = async () => {
  const places: { [key: string]: GooglePlace } = JSON.parse(
    fs.readFileSync(placeCachedPath).toString(),
  );
  for (const [key, place] of Object.entries(places)) {
    const { searchName } = place;
    if (!place.address) {
      try {
        console.log(`[${searchName}] getPlaceInfo...`);
        Object.assign(places[key], await getPlaceInfo(searchName));
      } catch (e) {
        console.log(`[${searchName}] no results`);
        // console.error(searchName, e);
      }
    }
  }
  fs.writeFileSync(placeCachedPath, JSON.stringify(places, null, 2));
};

export const loadCache = (): AirtableKeyMappingRow => {
  return JSON.parse(fs.readFileSync(cachedPath).toString('utf8'));
};

export const enrichStop = async () => {
  const places: { [key: string]: GooglePlace } = JSON.parse(
    fs.readFileSync(placeCachedPath).toString(),
  );
  const stops: { [key: string]: AirtableRow } = JSON.parse(
    fs.readFileSync(cachedPath).toString(),
  );

  // "施打站地址（自動）": "基隆市信義區信二路268號",
  // "施打站經度（自動）": 121.748322,
  // "施打站緯度（自動）": 25.130455,

  const entries = Object.entries(stops);
  const updates: { id: string; fields: AnyObject }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const [key, stop] = entries[i];
    const updateFields: AnyObject = {};
    const { fields } = stop;

    if (!fields['Google Maps URL（自動）']) {
      updateFields['Google Maps URL（自動）'] = places[key].googleMapsUrl;
    }
    if (!fields['施打站地址（自動）']) {
      updateFields['施打站地址（自動）'] = places[key].address;
    }
    if (!fields['施打站經度（自動）']) {
      updateFields['施打站經度（自動）'] = places[key].lng;
    }
    if (!fields['施打站緯度（自動）']) {
      updateFields['施打站緯度（自動）'] = places[key].lat;
    }

    if (!_.isEmpty(updateFields)) {
      console.log(
        key,
        fields['施打站全稱（自動）'],
        `${i + 1}/${entries.length}`,
      );
      console.log(updateFields);
      updates.push({ id: key, fields: updateFields });
    }
  }

  const chunkSize = 10;
  const chunkUpdates = _.chunk(updates, chunkSize);

  for (let i = 0; i < chunkUpdates.length; i++) {
    await base('施打點清單').update(chunkUpdates[i]);
    console.log(`${(i + 1) * chunkSize}/${updates.length}`);
  }
};

export const checkDuplicated = () => {
  const places: { [key: string]: GooglePlace } = JSON.parse(
    fs.readFileSync(placeCachedPath).toString(),
  );

  const placeIdTable: { [key: string]: string } = {};

  for (const [key, place] of Object.entries(places)) {
    if (placeIdTable[place.placeId]) {
      console.log('duplicated places');
      console.log(placeIdTable[place.placeId]);
      console.log(`${place.placeId} | ${place.searchName}`);
    }
    placeIdTable[place.placeId] = `${place.placeId} | ${place.searchName}`;
  }
};

// createCached().catch(console.error);
// enrichStop().catch(console.error);
// checkDuplicated();
