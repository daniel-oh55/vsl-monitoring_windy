// ===============================
// Noon Report Parser
// 현재 MELBOURNE BRIDGE .msg 형식 기준
// ===============================

async function parseNoonReportFile(file) {
  const buffer = await file.arrayBuffer();

  // Outlook .msg 파일 안의 텍스트는 UTF-16LE 형태로 들어있는 경우가 많음
  const utf16Text = decodeArrayBuffer(buffer, "utf-16le");
  const utf8Text = decodeArrayBuffer(buffer, "utf-8");

  // 둘 중 Noon Report 필드가 더 잘 보이는 텍스트 사용
  const text = utf16Text.includes("[NoonLat")
    ? utf16Text
    : utf8Text;

  return parseNoonReportText(text, file.name);
}

function decodeArrayBuffer(buffer, encoding) {
  try {
    return new TextDecoder(encoding).decode(buffer);
  } catch (error) {
    console.warn(`${encoding} decoding failed`, error);
    return "";
  }
}

function parseNoonReportText(text, fileName) {
  const reportType = extractBracketValue(text, "REPORT TYPE");
  const vessel = extractBracketValue(text, "Vessel");
  const callSign = extractBracketValue(text, "CallSign");
  const positionDate = extractBracketValue(text, "PositionDate");
  const noonLatRaw = extractBracketValue(text, "NoonLat");
  const noonLonRaw = extractBracketValue(text, "NoonLon");
  const distance = extractBracketValue(text, "Distance");
  const course = extractBracketValue(text, "Course");
  const nextPort =
  extractBracketValue(text, "Next Port") ||
  extractBracketValue(text, "NextPort") ||
  extractBracketValue(text, "To Port") ||
  extractBracketValue(text, "Destination");
  const speed =
  extractBracketValue(text, "Speed") ||
  extractBracketValue(text, "Avg Speed") ||
  extractBracketValue(text, "Average Speed");
  const waveHeight = extractBracketValue(text, "Wave Ht");

  const lat = parseNoonCoordinate(noonLatRaw);
  const lon = parseNoonCoordinate(noonLonRaw);

  if (!vessel || !isValidLatLon(lat, lon)) {
    throw new Error("Noon Report에서 선박명 또는 위치 정보를 찾을 수 없습니다.");
  }

return {
  sourceFile: fileName,
  reportType,
  vessel,
  callSign,
  positionDate,
  noonLatRaw,
  noonLonRaw,
  lat,
  lon,
  distance: Number(distance),
  course: Number(course),
  nextPort,
  speed: Number(speed),
  waveHeight: Number(waveHeight),
};
}

function extractBracketValue(text, key) {
  // 예: [NoonLat : 011-19.80N]
  const pattern = new RegExp(`\\[\\s*${escapeRegExp(key)}\\s*:\\s*([^\\]]+)\\]`, "i");
  const match = text.match(pattern);

  if (!match) return "";

  return match[1].trim();
}

function parseNoonCoordinate(value) {
  if (!value) return NaN;

  const text = String(value).trim().toUpperCase();

  // 예: 011-19.80N / 110-13.20E
  const match = text.match(/^(\d{1,3})-(\d{1,2}(?:\.\d+)?)([NSEW])$/);

  if (!match) return NaN;

  const degrees = Number(match[1]);
  const minutes = Number(match[2]);
  const direction = match[3];

  let decimal = degrees + minutes / 60;

  if (direction === "S" || direction === "W") {
    decimal = decimal * -1;
  }

  return decimal;
}

function isValidLatLon(lat, lon) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}