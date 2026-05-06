// ===============================
// 1. Windy API 설정
// ===============================

const WINDY_OPTIONS = {
  key: "ZubTMFcvKH87utliHssmxu0MzssuX6oI",
  lat: 24.5,
  lon: 125.0,
  zoom: 5,
  overlay: "wind",
};

// ===============================
// 2. 전역 변수
// ===============================

let windyMap = null;
let windyStore = null;

let noonReportMarker = null;
let noonReportLabelMarker = null;
let noonReportData = null;

let selectedVessel = null;
let selectedService = null;

let vesselMaster = [];
let serviceRoutes = [];

let activeServiceRouteLine = null;
let activeServiceWaypointMarkers = [];

let routeSnapMarker = null;
let routeFutureMarkers = [];
let routeFutureLine = null;

// ===============================
// 3. Windy 지도 초기화
// ===============================

windyInit(WINDY_OPTIONS, windyAPI => {
  const { map, store } = windyAPI;

  windyMap = map;
  windyStore = store;

setupLayerButtons();
loadInitialData();
setupNoonReportUpload();
});

// ===============================
// 4. Weather Layer 버튼
// ===============================

function setupLayerButtons() {
  const buttons = document.querySelectorAll(".layer-buttons button");
  const status = document.getElementById("weatherLayerStatus");

  if (!windyStore) return;

  const allowedOverlays = windyStore.getAllowed
    ? windyStore.getAllowed("overlay")
    : [];

  console.log("Allowed Windy overlays:", allowedOverlays);

  buttons.forEach(button => {
    const overlay = button.dataset.overlay;

    if (
      Array.isArray(allowedOverlays) &&
      allowedOverlays.length > 0 &&
      !allowedOverlays.includes(overlay)
    ) {
      button.disabled = true;
      button.title = `${overlay} overlay is not allowed with current Windy API setting.`;
      button.classList.add("disabled");

      if (status) {
        status.innerHTML += `<br>${overlay} not allowed`;
      }
    }

    button.addEventListener("click", () => {
      const selectedOverlay = button.dataset.overlay;

      if (!windyStore || button.disabled) return;

      try {
        if (
          windyStore.getAllowed &&
          windyStore.getAllowed("level")?.includes("surface")
        ) {
          windyStore.set("level", "surface");
        }

        windyStore.set("overlay", selectedOverlay);

        buttons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        if (status) {
          const actualOverlay = windyStore.get("overlay");
          status.innerHTML = `Current Layer: ${actualOverlay}`;
        }

        console.log("Windy overlay changed:", windyStore.get("overlay"));
      } catch (error) {
        console.error("Windy overlay change failed:", error);

        if (status) {
          status.innerHTML = `Layer change failed: ${selectedOverlay}`;
        }
      }
    });
  });
}

// ===============================
// 5. Vessel / Service 선택 UI
// ===============================

function setupVesselServiceControls() {
  const vesselSelect = document.getElementById("vesselSelect");
  const serviceSelect = document.getElementById("serviceSelect");

  if (!vesselSelect || !serviceSelect) return;

  vesselMaster.forEach(vessel => {
    const option = document.createElement("option");
    option.value = vessel.code;
    option.textContent = `${vessel.code} - ${vessel.name}`;
    vesselSelect.appendChild(option);
  });

  Object.values(SERVICE_ROUTES).forEach(service => {
    const option = document.createElement("option");
    option.value = service.code;
    option.textContent = `${service.code} - ${service.name}`;
    serviceSelect.appendChild(option);
  });

  vesselSelect.addEventListener("change", event => {
    const vesselCode = event.target.value;

    selectedVessel =
  vesselMaster.find(vessel => vessel.code === vesselCode) || null;

    updateSelectionStatus();

    // 중요:
    // 선박을 선택해도 서비스를 자동 선택하지 않습니다.
    // 서비스는 사용자가 별도로 선택합니다.
  });

  serviceSelect.addEventListener("change", event => {
    selectServiceRoute(event.target.value);
    updateSelectionStatus();
  });
}

// ===============================
// 6. 서비스 Route 선택 및 지도 표시
// ===============================

function selectServiceRoute(serviceCode) {
  selectedService = SERVICE_ROUTES[serviceCode] || null;

  clearServiceRoute();
  clearRouteBasedFutureLayers();

  if (!selectedService) return;

  showServiceRouteOnMap(selectedService);

  if (noonReportData) {
    showRouteBasedFuturePositions(noonReportData);
  }
}

function showServiceRouteOnMap(service) {
  if (!service.points || service.points.length < 2) {
    alert("서비스 Route Point가 충분하지 않습니다.");
    return;
  }

  const latLngs = service.points.map(point => [point.lat, point.lon]);

  activeServiceRouteLine = L.polyline(latLngs, {
    color: "#22c55e",
    weight: 3,
    opacity: 0.9,
  }).addTo(windyMap);

  service.points.forEach((point, index) => {
    const isFirst = index === 0;
    const isLast = index === service.points.length - 1;
    const hasName = point.name && point.name.length > 0;

    if (isFirst || isLast || hasName) {
      const marker = L.circleMarker([point.lat, point.lon], {
        radius: isFirst || isLast ? 6 : 4,
        color: "#22c55e",
        fillColor: "#22c55e",
        fillOpacity: 0.9,
        weight: 2,
      })
        .addTo(windyMap)
        .bindPopup(`
          <b>${point.name || "Waypoint"}</b><br>
          Service: ${service.code}<br>
          WPT: ${index + 1}<br>
          ${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}
        `);

      activeServiceWaypointMarkers.push(marker);
    }
  });

  windyMap.fitBounds(activeServiceRouteLine.getBounds(), {
    padding: [40, 40],
  });
}

function clearServiceRoute() {
  if (activeServiceRouteLine) {
    windyMap.removeLayer(activeServiceRouteLine);
    activeServiceRouteLine = null;
  }

  activeServiceWaypointMarkers.forEach(marker => {
    windyMap.removeLayer(marker);
  });

  activeServiceWaypointMarkers = [];
}

// ===============================
// 7. Noon Report 업로드 처리
// ===============================

function setupNoonReportUpload() {
  const noonReportInput = document.getElementById("noonReportInput");
  const noonReportStatus = document.getElementById("noonReportStatus");

  if (!noonReportInput || !noonReportStatus) return;

  noonReportInput.addEventListener("change", async event => {
    const file = event.target.files[0];

    if (!file) return;

    try {
      noonReportStatus.innerHTML = "Noon Report를 읽는 중입니다...";

      noonReportData = await parseNoonReportFile(file);

      autoSelectVesselByNoonReport(noonReportData);
showNoonReportOnMap(noonReportData);

if (selectedService) {
  showRouteBasedFuturePositions(noonReportData);
} else {
  updateVesselInfoWithoutRoute(noonReportData);
}

      noonReportStatus.innerHTML = `
        <span class="noon-position-label">${noonReportData.vessel}</span><br>
        Position: ${noonReportData.lat.toFixed(4)}, ${noonReportData.lon.toFixed(4)}<br>
        Date: ${noonReportData.positionDate}
      `;
    } catch (error) {
      console.error("Noon Report 읽기 오류:", error);

      noonReportStatus.innerHTML = `
        Noon Report 파일을 읽지 못했습니다.<br>
        파일 형식 또는 위치 정보 필드를 확인하세요.
      `;

      alert("Noon Report 파일을 읽는 중 오류가 발생했습니다.");
    }
  });
}

// ===============================
// 8. Noon Report 현재 위치 표시
// ===============================

function showNoonReportOnMap(report) {
  clearNoonReportMarker();

  // Today Noon 실제 위치 원형 마커
  noonReportMarker = L.circleMarker([report.lat, report.lon], {
    radius: 9,
    color: "#38bdf8",
    fillColor: "#38bdf8",
    fillOpacity: 0.95,
    weight: 3,
  })
    .addTo(windyMap)
    .bindPopup(`
      <b>${report.vessel}</b><br>
      Today Noon Position<br>
      Date: ${report.positionDate}<br>
      Lat/Lon: ${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}<br>
      Course: ${Number.isFinite(report.course) ? report.course + "°" : "-"}<br>
      Distance: ${Number.isFinite(report.distance) ? report.distance + " NM" : "-"}<br>
      Wave Ht: ${Number.isFinite(report.waveHeight) ? report.waveHeight + " m" : "-"}
    `);

  // Today Noon 라벨 마커
  noonReportLabelMarker = L.marker([report.lat, report.lon], {
    icon: L.divIcon({
      className: "today-noon-label",
      html: `<div>Today Noon</div>`,
      iconSize: [92, 28],
      iconAnchor: [-12, 14],
    }),
    interactive: false,
  }).addTo(windyMap);

  windyMap.setView([report.lat, report.lon], 6);
  noonReportMarker.openPopup();
}

function clearNoonReportMarker() {
  if (noonReportMarker) {
    windyMap.removeLayer(noonReportMarker);
    noonReportMarker = null;
  }

  if (noonReportLabelMarker) {
    windyMap.removeLayer(noonReportLabelMarker);
    noonReportLabelMarker = null;
  }
}

// ===============================
// 9. Noon Report 선박명 기준 자동 선택
// ===============================

function autoSelectVesselByNoonReport(report) {
  const vesselSelect = document.getElementById("vesselSelect");

  const reportVesselName = normalizeName(report.vessel);

  const matchedVessel = vesselMaster.find(vessel => {
    return normalizeName(vessel.name) === reportVesselName;
  });

  if (!matchedVessel) {
    console.warn("Noon Report 선박명과 매칭되는 등록 선박이 없습니다.");
    updateSelectionStatus("Noon Report 선박명과 등록 선박이 매칭되지 않았습니다.");
    return;
  }

  selectedVessel = matchedVessel;

  if (vesselSelect) {
    vesselSelect.value = matchedVessel.code;
  }

  // 중요:
  // Noon Report 업로드 시에도 서비스는 자동 선택하지 않습니다.
  // 이미 사용자가 서비스를 선택한 경우에만 해당 Route 기준으로 계산됩니다.
  updateSelectionStatus();
}

function normalizeName(name) {
  return String(name || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ===============================
// 10. Route Line 기준 +24H / +48H 예상 위치
// ===============================

function showRouteBasedFuturePositions(report) {
  clearRouteBasedFutureLayers();

  if (!selectedService || !selectedService.points || selectedService.points.length < 2) {
    console.warn("선택된 서비스 Route가 없습니다.");
    return;
  }

  const speedKnots = resolveSpeedKnots(report);

  if (!Number.isFinite(speedKnots) || speedKnots <= 0) {
    alert("속력 정보를 확인할 수 없습니다. Noon Report의 Speed 또는 Distance를 확인하세요.");
    return;
  }

  const result = calculateFuturePositionsOnRoute(
    report,
    selectedService.points,
    speedKnots
  );

  const snapped = result.nearest.projectedPoint;
  const pos24 = result.position24;
  const pos48 = result.position48;

  routeSnapMarker = L.circleMarker([snapped.lat, snapped.lon], {
    radius: 7,
    color: "#ffffff",
    fillColor: "#0ea5e9",
    fillOpacity: 0.95,
    weight: 3,
  })
    .addTo(windyMap)
    .bindPopup(`
      <b>${report.vessel}</b><br>
      Snapped Position on Route<br>
      Service: ${selectedService.code}<br>
      Distance from Route: ${result.nearest.distanceToSegmentNm.toFixed(1)} NM<br>
      Route Progress: ${result.nearest.distanceFromRouteStartNm.toFixed(1)} NM
    `);

  const marker24 = createTimeLabelMarker(
    [pos24.lat, pos24.lon],
    "+24H",
    "marker-24h",
    `
      <b>${report.vessel}</b><br>
      +24H Estimated Position on Route<br>
      Speed Basis: ${speedKnots.toFixed(2)} kt<br>
      ${pos24.lat.toFixed(4)}, ${pos24.lon.toFixed(4)}
      ${pos24.completed ? "<br><b>Route End Reached</b>" : ""}
    `
  );

  const marker48 = createTimeLabelMarker(
    [pos48.lat, pos48.lon],
    "+48H",
    "marker-48h",
    `
      <b>${report.vessel}</b><br>
      +48H Estimated Position on Route<br>
      Speed Basis: ${speedKnots.toFixed(2)} kt<br>
      ${pos48.lat.toFixed(4)}, ${pos48.lon.toFixed(4)}
      ${pos48.completed ? "<br><b>Route End Reached</b>" : ""}
    `
  );

  routeFutureLine = L.polyline(
    [
      [snapped.lat, snapped.lon],
      [pos24.lat, pos24.lon],
      [pos48.lat, pos48.lon],
    ],
    {
      color: "#38bdf8",
      weight: 3,
      opacity: 0.9,
      dashArray: "8, 8",
    }
  ).addTo(windyMap);

  routeFutureMarkers = [marker24, marker48];

  updateVesselInfoWithRouteForecast(report, result);
}

function createTimeLabelMarker(position, label, className, popupHtml) {
  return L.marker(position, {
    icon: L.divIcon({
      className: `time-label-marker ${className}`,
      html: `<div>${label}</div>`,
      iconSize: [54, 28],
      iconAnchor: [27, 14],
    }),
  })
    .addTo(windyMap)
    .bindPopup(popupHtml);
}

// ===============================
// 11. 속력 기준 결정
// ===============================

function resolveSpeedKnots(report) {
  if (Number.isFinite(report.speed) && report.speed > 0) {
    return report.speed;
  }

  if (Number.isFinite(report.distance) && report.distance > 0) {
    return report.distance / 24;
  }

  if (selectedVessel && Number.isFinite(Number(selectedVessel.defaultSpeed))) {
  return Number(selectedVessel.defaultSpeed);
}

  return NaN;
}

// ===============================
// 12. 왼쪽 정보 패널 업데이트
// ===============================

function updateVesselInfoWithRouteForecast(report, result) {
  const vesselInfo = document.getElementById("vesselInfo");

  const snapped = result.nearest.projectedPoint;
  const pos24 = result.position24;
  const pos48 = result.position48;

  vesselInfo.innerHTML = `
    <strong>${report.vessel}</strong><br>
    Source: Noon Report<br>
    Service: ${selectedService ? selectedService.code : "-"}<br>
    File: ${report.sourceFile}<br><br>

    <b>Noon Report Position</b><br>
    Raw LAT: ${report.noonLatRaw}<br>
    Raw LON: ${report.noonLonRaw}<br>
    Decimal: ${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}<br>
    Position Date: ${report.positionDate || "-"}<br><br>

    <b>Route Matching</b><br>
    Nearest Segment: ${result.nearest.segmentIndex + 1}<br>
    Distance from Route Line: ${result.nearest.distanceToSegmentNm.toFixed(1)} NM<br>
    Snapped Position: ${snapped.lat.toFixed(4)}, ${snapped.lon.toFixed(4)}<br>
    Route Progress: ${result.nearest.distanceFromRouteStartNm.toFixed(1)} NM<br><br>

    <b>Forecast on Route</b><br>
    Speed Basis: ${result.speedKnots.toFixed(2)} kt<br>
    +24H: ${pos24.lat.toFixed(4)}, ${pos24.lon.toFixed(4)}
    ${pos24.completed ? " / Route End" : ""}<br>
    +48H: ${pos48.lat.toFixed(4)}, ${pos48.lon.toFixed(4)}
    ${pos48.completed ? " / Route End" : ""}<br><br>

    <b>Navigation / Weather</b><br>
    Course: ${Number.isFinite(report.course) ? report.course + "°" : "-"}<br>
    Distance: ${Number.isFinite(report.distance) ? report.distance + " NM" : "-"}<br>
    Wave Ht: ${Number.isFinite(report.waveHeight) ? report.waveHeight + " m" : "-"}
  `;
}

function clearRouteBasedFutureLayers() {
  if (routeSnapMarker) {
    windyMap.removeLayer(routeSnapMarker);
    routeSnapMarker = null;
  }

  routeFutureMarkers.forEach(marker => {
    windyMap.removeLayer(marker);
  });

  routeFutureMarkers = [];

  if (routeFutureLine) {
    windyMap.removeLayer(routeFutureLine);
    routeFutureLine = null;
  }
}

function updateVesselInfoWithoutRoute(report) {
  const vesselInfo = document.getElementById("vesselInfo");

  vesselInfo.innerHTML = `
    <strong>${report.vessel}</strong><br>
    Source: Noon Report<br>
    Service: <span style="color:#facc15;">Not selected</span><br>
    File: ${report.sourceFile}<br><br>

    <b>Noon Report Position</b><br>
    Raw LAT: ${report.noonLatRaw}<br>
    Raw LON: ${report.noonLonRaw}<br>
    Decimal: ${report.lat.toFixed(4)}, ${report.lon.toFixed(4)}<br>
    Position Date: ${report.positionDate || "-"}<br><br>

    <b>Navigation</b><br>
    Course: ${Number.isFinite(report.course) ? report.course + "°" : "-"}<br>
    Next Port: ${report.nextPort || "-"}<br>
    Distance: ${Number.isFinite(report.distance) ? report.distance + " NM" : "-"}<br>
    Wave Ht: ${Number.isFinite(report.waveHeight) ? report.waveHeight + " m" : "-"}<br><br>

    <span style="color:#facc15;">
      Service Route를 선택하면 Route Matching 및 +24H / +48H 위치가 계산됩니다.
    </span>
  `;
}

function updateSelectionStatus(message = "") {
  const vesselInfo = document.getElementById("vesselInfo");

  if (!vesselInfo) return;

  const vesselText = selectedVessel
    ? `${selectedVessel.code} - ${selectedVessel.name}`
    : "Not selected";

  const serviceText = selectedService
    ? `${selectedService.code} - ${selectedService.name}`
    : "Not selected";

  if (!noonReportData) {
    vesselInfo.innerHTML = `
      <strong>Selection Status</strong><br><br>
      <b>Vessel</b><br>
      ${vesselText}<br><br>

      <b>Service Route</b><br>
      ${serviceText}<br><br>

      ${message ? `<span style="color:#facc15;">${message}</span><br><br>` : ""}
      Noon Report를 업로드하면 현재 위치가 표시됩니다.
    `;
  }
}

async function loadInitialData() {
  try {
    const vesselsResponse = await fetch("/api/vessels");

    if (!vesselsResponse.ok) {
      throw new Error("Failed to load vessels");
    }

    const vesselsResult = await vesselsResponse.json();

    vesselMaster = vesselsResult.success
      ? vesselsResult.data
      : vesselsResult;

    setupVesselServiceControls();
  } catch (error) {
    console.error("초기 선박 데이터 로딩 오류:", error);
    alert("선박 데이터를 불러오지 못했습니다. /api/vessels API를 확인하세요.");
  }
}