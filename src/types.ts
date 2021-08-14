// 1. 必要欄位：施打站全稱、施打站縣市、施打站地址
// 2. 選擇欄位：施打站行政區、施打站地址、官方提供網址、預約電話、醫事機構代碼、施打站經度、施打站緯度、爬蟲結果資料抓取時間

export type Place = {
  city: string;
  name: string;
  address: string;
  district?: string;
  phone?: string;
  lng?: number;
  lat?: number;
  specialty?: string;
  serial?: string;
  note?: string;
  department?: string;
  crawlerLastModified?: Date;
  googleMapsUrl?: string;
  googleMapsUrlLastModified?: Date;
};

export type GooglePlace = {
  searchName: string;
  address: string;
  phone: string;
  district: string;
  lat: string;
  lng: string;
  placeId: string;
  googleMapsUrl: string;
};

export type AnyObject = {
  [property: string]: any;
};

export type AirtableRow = {
  id: string;
  fields: AnyObject;
  createdTime: string;
};

export type AirtableKeyMappingRow = { [property: string]: AirtableRow };
