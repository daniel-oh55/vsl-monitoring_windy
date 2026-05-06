// ===============================
// Route Math Utilities
// 실제 Route Line 기반 위치 계산용
// ===============================

function routeToRadians(deg) {
  return deg * Math.PI / 180;
}

function routeToDegrees(rad) {
  return rad * 180 / Math.PI;
}

function normalizeRouteLongitude(lon) {
  return ((lon + 540) % 360) - 180;
}

function longitudeDiff(lonA, lonB) {
  return normalizeRouteLongitude(lonA - lonB);
}

// 두 좌표 간 거리, 단위: Nautical Mile
function haversineNm(pointA, pointB) {
  const earthRadiusNm = 3440.065;

  const lat1 = routeToRadians(pointA.lat);
  const lat2 = routeToRadians(pointB.lat);
  const dLat = routeToRadians(pointB.lat - pointA.lat);
  const dLon = routeToRadians(longitudeDiff(pointB.lon, pointA.lon));

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusNm * c;
}

// 두 좌표 사이의 중간점
function interpolatePoint(pointA, pointB, ratio) {
  const safeRatio = Math.max(0, Math.min(1, ratio));

  const lonDelta = longitudeDiff(pointB.lon, pointA.lon);

  return {
    name: "",
    lat: pointA.lat + (pointB.lat - pointA.lat) * safeRatio,
    lon: normalizeRouteLongitude(pointA.lon + lonDelta * safeRatio),
  };
}

// Route 전체 거리 계산
function calculateRouteTotalDistanceNm(points) {
  let total = 0;

  for (let i = 0; i < points.length - 1; i++) {
    total += haversineNm(points[i], points[i + 1]);
  }

  return total;
}

// 현재 위치가 Route Line의 어느 구간에 가장 가까운지 찾기
function findNearestPointOnRoute(position, routePoints) {
  if (!routePoints || routePoints.length < 2) {
    throw new Error("Route point가 충분하지 않습니다.");
  }

  let best = null;
  let cumulativeBeforeSegment = 0;

  for (let i = 0; i < routePoints.length - 1; i++) {
    const start = routePoints[i];
    const end = routePoints[i + 1];

    const segmentDistanceNm = haversineNm(start, end);

    const projected = projectPointToSegment(position, start, end);
    const distanceToSegmentNm = haversineNm(position, projected.point);

    const distanceFromRouteStartNm =
      cumulativeBeforeSegment + segmentDistanceNm * projected.ratio;

    if (!best || distanceToSegmentNm < best.distanceToSegmentNm) {
      best = {
        segmentIndex: i,
        segmentStart: start,
        segmentEnd: end,
        projectedPoint: projected.point,
        ratioOnSegment: projected.ratio,
        distanceToSegmentNm,
        distanceFromRouteStartNm,
      };
    }

    cumulativeBeforeSegment += segmentDistanceNm;
  }

  return best;
}

// 특정 위치를 Route Segment 위에 투영
// 실무용 표시 목적이므로, 짧은 구간에서는 충분히 안정적인 equirectangular projection 사용
function projectPointToSegment(position, segmentStart, segmentEnd) {
  const latRef = routeToRadians(
    (position.lat + segmentStart.lat + segmentEnd.lat) / 3
  );

  const startX = segmentStart.lon * Math.cos(latRef) * 60;
  const startY = segmentStart.lat * 60;

  const endX =
    (segmentStart.lon + longitudeDiff(segmentEnd.lon, segmentStart.lon)) *
    Math.cos(latRef) *
    60;
  const endY = segmentEnd.lat * 60;

  const posX =
    (segmentStart.lon + longitudeDiff(position.lon, segmentStart.lon)) *
    Math.cos(latRef) *
    60;
  const posY = position.lat * 60;

  const vectorX = endX - startX;
  const vectorY = endY - startY;

  const pointX = posX - startX;
  const pointY = posY - startY;

  const segmentLengthSquared = vectorX * vectorX + vectorY * vectorY;

  let ratio = 0;

  if (segmentLengthSquared > 0) {
    ratio = (pointX * vectorX + pointY * vectorY) / segmentLengthSquared;
  }

  ratio = Math.max(0, Math.min(1, ratio));

  const projectedPoint = interpolatePoint(segmentStart, segmentEnd, ratio);

  return {
    point: projectedPoint,
    ratio,
  };
}

// Route 시작점 기준 특정 거리 위치 계산
function getPointAtDistanceOnRoute(routePoints, targetDistanceNm) {
  if (!routePoints || routePoints.length < 2) {
    throw new Error("Route point가 충분하지 않습니다.");
  }

  if (targetDistanceNm <= 0) {
    return {
      ...routePoints[0],
      completed: false,
      distanceFromStartNm: 0,
    };
  }

  let cumulative = 0;

  for (let i = 0; i < routePoints.length - 1; i++) {
    const start = routePoints[i];
    const end = routePoints[i + 1];

    const segmentDistanceNm = haversineNm(start, end);

    if (cumulative + segmentDistanceNm >= targetDistanceNm) {
      const remainingInSegment = targetDistanceNm - cumulative;
      const ratio = remainingInSegment / segmentDistanceNm;
      const point = interpolatePoint(start, end, ratio);

      return {
        ...point,
        completed: false,
        segmentIndex: i,
        distanceFromStartNm: targetDistanceNm,
      };
    }

    cumulative += segmentDistanceNm;
  }

  const lastPoint = routePoints[routePoints.length - 1];

  return {
    ...lastPoint,
    completed: true,
    segmentIndex: routePoints.length - 2,
    distanceFromStartNm: cumulative,
  };
}

// Noon Report 위치 기준 +24H / +48H 위치 계산
function calculateFuturePositionsOnRoute(report, routePoints, speedKnots) {
  const currentPosition = {
    lat: report.lat,
    lon: report.lon,
  };

  const nearest = findNearestPointOnRoute(currentPosition, routePoints);

  const distance24 = nearest.distanceFromRouteStartNm + speedKnots * 24;
  const distance48 = nearest.distanceFromRouteStartNm + speedKnots * 48;

  const position24 = getPointAtDistanceOnRoute(routePoints, distance24);
  const position48 = getPointAtDistanceOnRoute(routePoints, distance48);

  return {
    nearest,
    position24,
    position48,
    speedKnots,
    distance24,
    distance48,
  };
}