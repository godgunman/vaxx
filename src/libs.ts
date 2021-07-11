/* eslint-disable camelcase */
import { GOOGLE_API_KEY } from './constants';
import fetch from 'node-fetch';
import { Place } from './types';

export const jsonToCsv = (
  keys: string[],
  csvKeysMap: string[],
  data: Place[],
) => {
  const rows = [csvKeysMap.join(',')];
  for (const obj of data) {
    const row = keys.map(k => (obj as any)[k as any]).join(',');
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
  };
};
