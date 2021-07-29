/* eslint-disable camelcase */
import { GOOGLE_API_KEY } from './constants';
import fetch from 'node-fetch';
import { Place } from './types';

// eslint-disable-next-line no-unused-vars
const csvKeysMap: { [key in keyof Place]: string } = {
  city: '施打站縣市',
  name: '施打站全稱',
  district: '施打站行政區',
  address: '施打站地址',
  phone: '預約電話',
  lng: '施打站經度',
  lat: '施打站緯度',
  specialty: 'specialty',
  serial: 'serial',
  note: 'note',
  department: 'department',
  crawlerLastModified: '爬蟲結果資料抓取時間',
  googleMapsUrl: 'Google Maps Url',
  googleMapsUrlLastModified: 'Google Maps Url last modified',
};

export const jsonToCsv = (keys: (keyof Place)[], data: Place[]) => {
  const rows = [keys.map(key => csvKeysMap[key]).join(',')];
  for (const obj of data) {
    const row = keys
      .map(k => {
        if (k === 'googleMapsUrlLastModified' || k === 'crawlerLastModified') {
          return obj[k]?.toISOString();
        } else {
          return obj[k];
        }
      })
      .join(',');
    rows.push(row);
  }
  return rows;
};

export const getPlaceInfo = async (
  name: string,
): Promise<{
  address: string;
  phone: string;
  district: string;
  lat: string;
  lng: string;
  placeId: string;
  googleMapsUrl: string;
  googleMapsUrlLastModified: Date;
}> => {
  const encodedName = encodeURI(name);
  const findPlaceFromText = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodedName}&inputtype=textquery&key=${GOOGLE_API_KEY}`;

  const { candidates } = await (await fetch(findPlaceFromText)).json();
  const placeId = candidates[0].place_id;
  const details = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}&language=zh-TW`;

  const {
    result: {
      formatted_address,
      formatted_phone_number,
      address_components,
      geometry: {
        location: { lat, lng },
      },
    },
  } = await (await fetch(details)).json();

  let district = '';

  for (const component of address_components) {
    if (component.types.indexOf('administrative_area_level_3') !== -1) {
      district = component.long_name;
    }
  }

  return {
    address: formatted_address,
    phone: formatted_phone_number,
    district,
    lat,
    lng,
    placeId,
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    googleMapsUrlLastModified: new Date(),
  };
};

export const decorateByPlaceApi = async (
  places: (Partial<Place> & { name: string; city: string })[],
) => {
  const results: Place[] = [];

  const promises = places.map(async (place, index) => {
    const { name, city } = place;

    console.log(name);
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
    results[index] = { ...placeInfo, ...place };
  });

  await Promise.all(promises);
  return results;
};
