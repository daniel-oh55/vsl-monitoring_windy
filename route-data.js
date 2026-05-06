// ===============================
// Vessel Master Data
// 현재는 코드 내 고정 데이터
// 추후 Supabase vessels table로 분리 예정
// ===============================

const VESSEL_MASTER = [
  {
    code: "MEBG",
    name: "MELBOURNE BRIDGE",
    serviceCode: "SIS2_WB_SOUTH",
    defaultSpeed: 13.1,
  },
  {
    code: "ZGHZ",
    name: "ZHONG GU HANG ZHOU",
    serviceCode: "SIS2_WB_SOUTH",
    defaultSpeed: 13.5,
  },
  {
    code: "ZGLZ",
    name: "ZHONG GU LAN ZHOU",
    serviceCode: "SIS2_WB_SOUTH",
    defaultSpeed: 13.5,
  },
  {
    code: "ZGXA",
    name: "ZHONG GU XI AN",
    serviceCode: "SIS2_WB_SOUTH",
    defaultSpeed: 13.5,
  },
];

// ===============================
// Service Route Master Data
// 현재는 코드 내 고정 데이터
// 추후 Supabase service_waypoints table로 분리 예정
// ===============================
//
// 주의:
// 아래 좌표는 실제 SIS2 ECDIS Route를 기반으로 테스트하기 위한 축약 버전입니다.
// ECDIS 전체 Waypoint를 모두 넣으면 4,000줄 이상이 되므로,
// 우선 앱 기능 검증용으로 주요 변침점과 항로 흐름 중심으로 구성했습니다.
//
// 서비스 구분:
// - SIS2_WB_SOUTH : Westbound / South route
// - SIS2_WB_NORTH : Westbound / North route
// - SIS2_EB       : Eastbound / Karachi → Port Klang → Korea
//

const SERVICE_ROUTES = {
  SIS2_WB_SOUTH: {
    code: "SIS2_WB_SOUTH",
    name: "SIS2 WB SOUTH - Korea/China/Hong Kong/Port Klang/India/Pakistan",
    description:
      "SIS2 westbound route from Korea to Pakistan via South China Sea and Port Klang South approach.",

    points: [
      // ===============================
      // KRPUS → KRKAN
      // ===============================
      { name: "KRPUS BERTH", lat: 35.076967, lon: 128.795317, leg: "KRPUS-KRKAN" },
      { name: "PUS P/S", lat: 34.9654, lon: 128.8032, leg: "KRPUS-KRKAN" },
      { name: "KRPUS ECA OUT", lat: 34.917683, lon: 128.845117, leg: "KRPUS-KRKAN" },
      { name: "KRKAN LOW SPD IN", lat: 34.5307, lon: 128.090217, leg: "KRPUS-KRKAN" },
      { name: "KRKAN ECA IN", lat: 34.59167, lon: 127.95833, leg: "KRPUS-KRKAN" },
      { name: "KRKAN P/S", lat: 34.7339, lon: 127.83075, leg: "KRPUS-KRKAN" },
      { name: "LEESUNSHIN BRIDGE", lat: 34.909, lon: 127.7049, leg: "KRPUS-KRKAN" },
      { name: "KRKAN BERTH", lat: 34.89225, lon: 127.655083, leg: "KRPUS-KRKAN" },

      // ===============================
      // KRKAN → CNSHA
      // ===============================
      { name: "KRKAN DEPARTURE", lat: 34.892233, lon: 127.653367, leg: "KRKAN-CNSHA" },
      { name: "KAN P/S", lat: 34.7595, lon: 127.814167, leg: "KRKAN-CNSHA" },
      { name: "KOREA ECA OUT", lat: 34.595, lon: 127.933833, leg: "KRKAN-CNSHA" },
      { name: "S JEJU TRAFFIC", lat: 33.29925, lon: 127.102883, leg: "KRKAN-CNSHA" },
      { name: "TEMP ANCHOR", lat: 32.535567, lon: 124.18835, leg: "KRKAN-CNSHA" },
      { name: "CNSHA ECA IN", lat: 31.113533, lon: 123.0062, leg: "KRKAN-CNSHA" },
      { name: "CJK ANCH", lat: 31.11265, lon: 122.613183, leg: "KRKAN-CNSHA" },
      { name: "CNSHA P/S", lat: 31.11115, lon: 122.429333, leg: "KRKAN-CNSHA" },
      { name: "CNSHA BERTH", lat: 31.233083, lon: 121.498, leg: "KRKAN-CNSHA" },

      // ===============================
      // CNSHA → CNNGB
      // ===============================
      { name: "CNSHA DEPARTURE", lat: 31.233083, lon: 121.498, leg: "CNSHA-CNNGB" },
      { name: "YANGTZE RIVER OUT", lat: 31.11115, lon: 122.429333, leg: "CNSHA-CNNGB" },
      { name: "EAST CHINA SEA", lat: 30.55, lon: 122.65, leg: "CNSHA-CNNGB" },
      { name: "NGB APPROACH", lat: 29.95, lon: 122.35, leg: "CNSHA-CNNGB" },
      { name: "CNNGB P/S", lat: 29.884, lon: 122.127, leg: "CNSHA-CNNGB" },
      { name: "CNNGB BERTH", lat: 29.935, lon: 121.85, leg: "CNSHA-CNNGB" },

      // ===============================
      // CNNGB → CNSHK
      // ===============================
      { name: "CNNGB DEPARTURE", lat: 29.935, lon: 121.85, leg: "CNNGB-CNSHK" },
      { name: "EAST CHINA SEA SOUTH", lat: 27.5, lon: 122.0, leg: "CNNGB-CNSHK" },
      { name: "TAIWAN STRAIT NORTH", lat: 25.6, lon: 121.6, leg: "CNNGB-CNSHK" },
      { name: "TAIWAN STRAIT MID", lat: 24.0, lon: 120.4, leg: "CNNGB-CNSHK" },
      { name: "TAIWAN STRAIT SOUTH", lat: 22.7, lon: 119.2, leg: "CNNGB-CNSHK" },
      { name: "HONG KONG APPROACH", lat: 22.1, lon: 114.5, leg: "CNNGB-CNSHK" },
      { name: "CNSHK P/S", lat: 22.25, lon: 114.25, leg: "CNNGB-CNSHK" },
      { name: "CNSHK BERTH", lat: 22.315, lon: 114.12, leg: "CNNGB-CNSHK" },

      // ===============================
      // CNSHK → MYPKG SOUTH
      // MELBOURNE BRIDGE Noon Report 위치 11-19.80N / 110-13.20E는 이 구간 부근
      // ===============================
      { name: "CNSHK DEPARTURE", lat: 22.315, lon: 114.12, leg: "CNSHK-MYPKG SOUTH" },
      { name: "SOUTH CHINA SEA 01", lat: 20.5, lon: 114.1, leg: "CNSHK-MYPKG SOUTH" },
      { name: "SOUTH CHINA SEA 02", lat: 18.0, lon: 113.4, leg: "CNSHK-MYPKG SOUTH" },
      { name: "SOUTH CHINA SEA 03", lat: 15.5, lon: 112.3, leg: "CNSHK-MYPKG SOUTH" },
      { name: "SOUTH CHINA SEA 04", lat: 13.2, lon: 111.2, leg: "CNSHK-MYPKG SOUTH" },
      { name: "SOUTH CHINA SEA 05", lat: 11.33, lon: 110.22, leg: "CNSHK-MYPKG SOUTH" },
      { name: "SOUTH CHINA SEA 06", lat: 8.8, lon: 107.8, leg: "CNSHK-MYPKG SOUTH" },
      { name: "VIETNAM OFFSHORE", lat: 6.7, lon: 105.6, leg: "CNSHK-MYPKG SOUTH" },
      { name: "SINGAPORE STRAIT EAST", lat: 1.65, lon: 104.6, leg: "CNSHK-MYPKG SOUTH" },
      { name: "SINGAPORE STRAIT", lat: 1.25, lon: 103.85, leg: "CNSHK-MYPKG SOUTH" },
      { name: "MALACCA STRAIT SOUTH", lat: 2.1, lon: 102.8, leg: "CNSHK-MYPKG SOUTH" },
      { name: "MYPKG APPROACH", lat: 2.75, lon: 101.65, leg: "CNSHK-MYPKG SOUTH" },
      { name: "MYPKG P/S", lat: 2.92, lon: 101.36, leg: "CNSHK-MYPKG SOUTH" },
      { name: "MYPKG BERTH", lat: 3.0, lon: 101.31, leg: "CNSHK-MYPKG SOUTH" },

      // ===============================
      // MYPKG → INNSA
      // ===============================
      { name: "MYPKG DEPARTURE", lat: 3.0, lon: 101.31, leg: "MYPKG-INNSA" },
      { name: "MALACCA STRAIT NORTH", lat: 4.5, lon: 100.5, leg: "MYPKG-INNSA" },
      { name: "ANDAMAN SEA", lat: 8.0, lon: 96.5, leg: "MYPKG-INNSA" },
      { name: "BAY OF BENGAL SOUTH", lat: 10.5, lon: 91.5, leg: "MYPKG-INNSA" },
      { name: "SRI LANKA EAST", lat: 6.8, lon: 83.5, leg: "MYPKG-INNSA" },
      { name: "SRI LANKA SOUTH", lat: 5.5, lon: 80.5, leg: "MYPKG-INNSA" },
      { name: "ARABIAN SEA SOUTH", lat: 9.5, lon: 75.0, leg: "MYPKG-INNSA" },
      { name: "INDIA WEST COAST", lat: 15.0, lon: 72.5, leg: "MYPKG-INNSA" },
      { name: "INNSA APPROACH", lat: 18.55, lon: 72.55, leg: "MYPKG-INNSA" },
      { name: "INNSA P/S", lat: 18.85, lon: 72.75, leg: "MYPKG-INNSA" },
      { name: "INNSA BERTH", lat: 18.95, lon: 72.95, leg: "MYPKG-INNSA" },

      // ===============================
      // INNSA → INMUN
      // ===============================
      { name: "INNSA DEPARTURE", lat: 18.95, lon: 72.95, leg: "INNSA-INMUN" },
      { name: "INDIA NW COAST 01", lat: 19.8, lon: 72.3, leg: "INNSA-INMUN" },
      { name: "INDIA NW COAST 02", lat: 20.8, lon: 71.4, leg: "INNSA-INMUN" },
      { name: "GULF OF KUTCH APPROACH", lat: 21.9, lon: 70.2, leg: "INNSA-INMUN" },
      { name: "INMUN P/S", lat: 22.65, lon: 69.7, leg: "INNSA-INMUN" },
      { name: "INMUN BERTH", lat: 22.75, lon: 69.72, leg: "INNSA-INMUN" },

      // ===============================
      // INMUN → PKKHI
      // ===============================
      { name: "INMUN DEPARTURE", lat: 22.75, lon: 69.72, leg: "INMUN-PKKHI" },
      { name: "GULF OF KUTCH OUT", lat: 22.6, lon: 69.25, leg: "INMUN-PKKHI" },
      { name: "ARABIAN SEA NORTH", lat: 23.4, lon: 67.8, leg: "INMUN-PKKHI" },
      { name: "PKKHI ECA", lat: 24.43, lon: 66.91, leg: "INMUN-PKKHI" },
      { name: "A ANCHORAGE", lat: 24.675, lon: 66.901, leg: "INMUN-PKKHI" },
      { name: "PKKHI P/S", lat: 24.702, lon: 66.931, leg: "INMUN-PKKHI" },
      { name: "PKKHI BERTH", lat: 24.805, lon: 66.988, leg: "INMUN-PKKHI" },
    ],
  },

  SIS2_WB_NORTH: {
    code: "SIS2_WB_NORTH",
    name: "SIS2 WB NORTH - Korea/China/Hong Kong/Port Klang/India/Pakistan",
    description:
      "SIS2 westbound route from Korea to Pakistan via North variant between Hong Kong and Port Klang.",

    points: [
      // ===============================
      // KRPUS → CNSHK
      // WB SOUTH와 동일한 구간
      // ===============================
      { name: "KRPUS BERTH", lat: 35.076967, lon: 128.795317, leg: "KRPUS-KRKAN" },
      { name: "PUS P/S", lat: 34.9654, lon: 128.8032, leg: "KRPUS-KRKAN" },
      { name: "KRPUS ECA OUT", lat: 34.917683, lon: 128.845117, leg: "KRPUS-KRKAN" },
      { name: "KRKAN LOW SPD IN", lat: 34.5307, lon: 128.090217, leg: "KRPUS-KRKAN" },
      { name: "KRKAN BERTH", lat: 34.89225, lon: 127.655083, leg: "KRPUS-KRKAN" },

      { name: "KRKAN DEPARTURE", lat: 34.892233, lon: 127.653367, leg: "KRKAN-CNSHA" },
      { name: "S JEJU TRAFFIC", lat: 33.29925, lon: 127.102883, leg: "KRKAN-CNSHA" },
      { name: "TEMP ANCHOR", lat: 32.535567, lon: 124.18835, leg: "KRKAN-CNSHA" },
      { name: "CNSHA ECA IN", lat: 31.113533, lon: 123.0062, leg: "KRKAN-CNSHA" },
      { name: "CNSHA BERTH", lat: 31.233083, lon: 121.498, leg: "KRKAN-CNSHA" },

      { name: "CNSHA DEPARTURE", lat: 31.233083, lon: 121.498, leg: "CNSHA-CNNGB" },
      { name: "EAST CHINA SEA", lat: 30.55, lon: 122.65, leg: "CNSHA-CNNGB" },
      { name: "CNNGB BERTH", lat: 29.935, lon: 121.85, leg: "CNSHA-CNNGB" },

      { name: "CNNGB DEPARTURE", lat: 29.935, lon: 121.85, leg: "CNNGB-CNSHK" },
      { name: "TAIWAN STRAIT NORTH", lat: 25.6, lon: 121.6, leg: "CNNGB-CNSHK" },
      { name: "TAIWAN STRAIT MID", lat: 24.0, lon: 120.4, leg: "CNNGB-CNSHK" },
      { name: "TAIWAN STRAIT SOUTH", lat: 22.7, lon: 119.2, leg: "CNNGB-CNSHK" },
      { name: "HONG KONG APPROACH", lat: 22.1, lon: 114.5, leg: "CNNGB-CNSHK" },
      { name: "CNSHK BERTH", lat: 22.315, lon: 114.12, leg: "CNNGB-CNSHK" },

      // ===============================
      // CNSHK → MYPKG NORTH
      // NORTH 변형: 남중국해를 조금 더 북쪽/동쪽으로 지나도록 구성
      // ===============================
      { name: "CNSHK DEPARTURE", lat: 22.315, lon: 114.12, leg: "CNSHK-MYPKG NORTH" },
      { name: "SOUTH CHINA SEA NORTH 01", lat: 21.0, lon: 115.0, leg: "CNSHK-MYPKG NORTH" },
      { name: "SOUTH CHINA SEA NORTH 02", lat: 19.0, lon: 114.3, leg: "CNSHK-MYPKG NORTH" },
      { name: "SOUTH CHINA SEA NORTH 03", lat: 16.5, lon: 113.0, leg: "CNSHK-MYPKG NORTH" },
      { name: "SOUTH CHINA SEA NORTH 04", lat: 14.0, lon: 111.8, leg: "CNSHK-MYPKG NORTH" },
      { name: "SOUTH CHINA SEA NORTH 05", lat: 11.8, lon: 110.5, leg: "CNSHK-MYPKG NORTH" },
      { name: "SOUTH CHINA SEA NORTH 06", lat: 9.4, lon: 108.2, leg: "CNSHK-MYPKG NORTH" },
      { name: "VIETNAM OFFSHORE NORTH", lat: 7.0, lon: 106.2, leg: "CNSHK-MYPKG NORTH" },
      { name: "SINGAPORE STRAIT EAST", lat: 1.65, lon: 104.6, leg: "CNSHK-MYPKG NORTH" },
      { name: "SINGAPORE STRAIT", lat: 1.25, lon: 103.85, leg: "CNSHK-MYPKG NORTH" },
      { name: "MYPKG APPROACH", lat: 2.75, lon: 101.65, leg: "CNSHK-MYPKG NORTH" },
      { name: "MYPKG BERTH", lat: 3.0, lon: 101.31, leg: "CNSHK-MYPKG NORTH" },

      // ===============================
      // MYPKG → PKKHI
      // WB SOUTH와 동일한 큰 흐름
      // ===============================
      { name: "MYPKG DEPARTURE", lat: 3.0, lon: 101.31, leg: "MYPKG-INNSA" },
      { name: "MALACCA STRAIT NORTH", lat: 4.5, lon: 100.5, leg: "MYPKG-INNSA" },
      { name: "ANDAMAN SEA", lat: 8.0, lon: 96.5, leg: "MYPKG-INNSA" },
      { name: "BAY OF BENGAL SOUTH", lat: 10.5, lon: 91.5, leg: "MYPKG-INNSA" },
      { name: "SRI LANKA SOUTH", lat: 5.5, lon: 80.5, leg: "MYPKG-INNSA" },
      { name: "ARABIAN SEA SOUTH", lat: 9.5, lon: 75.0, leg: "MYPKG-INNSA" },
      { name: "INDIA WEST COAST", lat: 15.0, lon: 72.5, leg: "MYPKG-INNSA" },
      { name: "INNSA BERTH", lat: 18.95, lon: 72.95, leg: "MYPKG-INNSA" },

      { name: "INNSA DEPARTURE", lat: 18.95, lon: 72.95, leg: "INNSA-INMUN" },
      { name: "INDIA NW COAST 01", lat: 19.8, lon: 72.3, leg: "INNSA-INMUN" },
      { name: "GULF OF KUTCH APPROACH", lat: 21.9, lon: 70.2, leg: "INNSA-INMUN" },
      { name: "INMUN BERTH", lat: 22.75, lon: 69.72, leg: "INNSA-INMUN" },

      { name: "INMUN DEPARTURE", lat: 22.75, lon: 69.72, leg: "INMUN-PKKHI" },
      { name: "GULF OF KUTCH OUT", lat: 22.6, lon: 69.25, leg: "INMUN-PKKHI" },
      { name: "ARABIAN SEA NORTH", lat: 23.4, lon: 67.8, leg: "INMUN-PKKHI" },
      { name: "PKKHI ECA", lat: 24.43, lon: 66.91, leg: "INMUN-PKKHI" },
      { name: "PKKHI BERTH", lat: 24.805, lon: 66.988, leg: "INMUN-PKKHI" },
    ],
  },

  SIS2_EB: {
    code: "SIS2_EB",
    name: "SIS2 EB - Pakistan/Port Klang/Korea",
    description:
      "SIS2 eastbound return route from Karachi to Korea via Port Klang.",

    points: [
      // ===============================
      // PKKHI → MYPKG
      // ===============================
      { name: "PKKHI BERTH", lat: 24.805, lon: 66.988, leg: "PKKHI-MYPKG" },
      { name: "PKKHI P/S", lat: 24.702, lon: 66.931, leg: "PKKHI-MYPKG" },
      { name: "A ANCHORAGE", lat: 24.675, lon: 66.901, leg: "PKKHI-MYPKG" },
      { name: "PKKHI ECA OUT", lat: 24.43, lon: 66.91, leg: "PKKHI-MYPKG" },
      { name: "ARABIAN SEA NORTH", lat: 23.5, lon: 67.8, leg: "PKKHI-MYPKG" },
      { name: "ARABIAN SEA MID", lat: 18.0, lon: 70.5, leg: "PKKHI-MYPKG" },
      { name: "ARABIAN SEA SOUTH", lat: 12.0, lon: 74.5, leg: "PKKHI-MYPKG" },
      { name: "SRI LANKA SOUTH", lat: 5.5, lon: 80.5, leg: "PKKHI-MYPKG" },
      { name: "BAY OF BENGAL SOUTH", lat: 8.5, lon: 88.0, leg: "PKKHI-MYPKG" },
      { name: "ANDAMAN SEA", lat: 8.0, lon: 96.5, leg: "PKKHI-MYPKG" },
      { name: "MALACCA STRAIT NORTH", lat: 4.5, lon: 100.5, leg: "PKKHI-MYPKG" },
      { name: "MYPKG APPROACH", lat: 2.75, lon: 101.65, leg: "PKKHI-MYPKG" },
      { name: "MYPKG P/S", lat: 2.92, lon: 101.36, leg: "PKKHI-MYPKG" },
      { name: "MYPKG BERTH", lat: 3.0, lon: 101.31, leg: "PKKHI-MYPKG" },

      // ===============================
      // MYPKG → KRPUS
      // MELBOURNE BRIDGE Noon Report 위치가 EB일 경우 이 구간과도 비교 가능
      // ===============================
      { name: "MYPKG DEPARTURE", lat: 3.0, lon: 101.31, leg: "MYPKG-KRPUS" },
      { name: "MALACCA STRAIT SOUTH", lat: 2.1, lon: 102.8, leg: "MYPKG-KRPUS" },
      { name: "SINGAPORE STRAIT", lat: 1.25, lon: 103.85, leg: "MYPKG-KRPUS" },
      { name: "SINGAPORE STRAIT EAST", lat: 1.65, lon: 104.6, leg: "MYPKG-KRPUS" },
      { name: "VIETNAM OFFSHORE", lat: 6.7, lon: 105.6, leg: "MYPKG-KRPUS" },
      { name: "SOUTH CHINA SEA 06", lat: 8.8, lon: 107.8, leg: "MYPKG-KRPUS" },
      { name: "SOUTH CHINA SEA 05", lat: 11.33, lon: 110.22, leg: "MYPKG-KRPUS" },
      { name: "SOUTH CHINA SEA 04", lat: 13.2, lon: 111.2, leg: "MYPKG-KRPUS" },
      { name: "SOUTH CHINA SEA 03", lat: 15.5, lon: 112.3, leg: "MYPKG-KRPUS" },
      { name: "SOUTH CHINA SEA 02", lat: 18.0, lon: 113.4, leg: "MYPKG-KRPUS" },
      { name: "SOUTH CHINA SEA 01", lat: 20.5, lon: 114.1, leg: "MYPKG-KRPUS" },
      { name: "TAIWAN STRAIT SOUTH", lat: 22.7, lon: 119.2, leg: "MYPKG-KRPUS" },
      { name: "TAIWAN STRAIT MID", lat: 24.0, lon: 120.4, leg: "MYPKG-KRPUS" },
      { name: "TAIWAN STRAIT NORTH", lat: 25.6, lon: 121.6, leg: "MYPKG-KRPUS" },
      { name: "EAST CHINA SEA SOUTH", lat: 27.5, lon: 122.0, leg: "MYPKG-KRPUS" },
      { name: "EAST CHINA SEA", lat: 30.55, lon: 122.65, leg: "MYPKG-KRPUS" },
      { name: "S JEJU APPROACH", lat: 33.29925, lon: 127.102883, leg: "MYPKG-KRPUS" },
      { name: "KOREA ECA IN", lat: 34.595, lon: 127.933833, leg: "MYPKG-KRPUS" },
      { name: "KRPUS ECA IN", lat: 34.917683, lon: 128.845117, leg: "MYPKG-KRPUS" },
      { name: "PUS P/S", lat: 34.9654, lon: 128.8032, leg: "MYPKG-KRPUS" },
      { name: "KRPUS BERTH", lat: 35.076967, lon: 128.795317, leg: "MYPKG-KRPUS" },
    ],
  },
};