import React, { useMemo } from "react";
import { MapContainer, TileLayer, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { Store } from "lucide-react";

// Emfuleni Local Municipality — Vereeniging / Vaal Triangle
const EMFULENI_CENTER = [-26.6736, 27.9261];
const EMFULENI_ZOOM = 12;

// Known Emfuleni area coordinates
const AREA_COORDS = {
  "Vereeniging": [-26.6736, 27.9261],
  "Vanderbijlpark": [-26.7115, 27.8419],
  "Sebokeng": [-26.5600, 27.8400],
  "Evaton": [-26.5400, 27.8600],
  "Sharpeville": [-26.6680, 27.8720],
  "Boipatong": [-26.6980, 27.8450],
  "Bophelong": [-26.7050, 27.8500],
  "Tshepiso": [-26.5700, 27.8500],
  "Residensia": [-26.6800, 27.9000],
  "Bedworth Park": [-26.6500, 27.9200],
  "Peacehaven": [-26.6900, 27.9000],
  "Duncanville": [-26.6700, 27.9100],
  "Unitas Park": [-26.6600, 27.9300],
  "Falcon Ridge": [-26.6400, 27.8900],
  "Three Rivers": [-26.6500, 27.9000],
  "Steel Park": [-26.7000, 27.8300],
  "Vaalpark": [-26.7200, 27.8300],
  "Sicelo": [-26.5500, 27.8300],
};

// Emfuleni bounding box for ward-based fallback
const BOUNDS = { minLat: -26.82, maxLat: -26.50, minLng: 27.75, maxLng: 28.05 };

// Spread ward numbers across the Emfuleni area in a grid
function wardCoords(wardNumber) {
  const cols = 8;
  const idx = (wardNumber - 1) % 45;
  const row = Math.floor(idx / cols);
  const col = idx % cols;
  const lat = BOUNDS.maxLat - (row / 6) * (BOUNDS.maxLat - BOUNDS.minLat);
  const lng = BOUNDS.minLng + (col / (cols - 1)) * (BOUNDS.maxLng - BOUNDS.minLng);
  // Small offset so same-ward dots don't perfectly overlap
  const jitter = ((wardNumber * 7) % 5) * 0.003;
  return [lat + jitter, lng - jitter];
}

// Resolve coordinates for a business: real lat/long → area name → ward number
function getBusinessCoords(b, index) {
  if (b.latitude != null && b.longitude != null && !isNaN(b.latitude) && !isNaN(b.longitude)) {
    return [b.latitude, b.longitude];
  }
  if (b.area && AREA_COORDS[b.area]) {
    // Small offset by index so same-area dots don't overlap
    const off = (index % 4) * 0.004;
    return [AREA_COORDS[b.area][0] + off, AREA_COORDS[b.area][1] - off];
  }
  if (b.ward_number) {
    return wardCoords(b.ward_number);
  }
  // Last resort: spread by index across the center area
  const off = (index % 6) * 0.005;
  return [EMFULENI_CENTER[0] + off - 0.015, EMFULENI_CENTER[1] - off + 0.01];
}

export default function OfficerMap() {
  const { data, loading } = useLedList(() =>
    Promise.all([
      base44.entities.Business.list().catch(() => []),
      base44.entities.Ward.list().catch(() => []),
    ])
  );

  const businesses = data?.[0] || [];
  const wards = data?.[1] || [];

  // All businesses with resolved coordinates (real or fallback)
  const mapped = useMemo(
    () =>
      businesses.map((b, i) => ({
        ...b,
        _coords: getBusinessCoords(b, i),
        _hasRealCoords:
          b.latitude != null &&
          b.longitude != null &&
          !isNaN(b.latitude) &&
          !isNaN(b.longitude),
      })),
    [businesses]
  );

  if (loading) return <SectionLoading />;

  return (
    <div>
      <PageHeader title="Map" subtitle="Business locations across Emfuleni's wards." />

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="led-chip on flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5" />
          {mapped.length} businesses
        </span>
        {wards.length > 0 && <span className="led-chip">{wards.length} wards</span>}
      </div>

      {businesses.length === 0 ? (
        <SectionEmpty>No business data yet.</SectionEmpty>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-line shadow-sm" style={{ height: "500px" }}>
          <MapContainer
            center={EMFULENI_CENTER}
            zoom={EMFULENI_ZOOM}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapped.map((b) => (
              <CircleMarker
                key={b.id}
                center={b._coords}
                radius={8}
                pathOptions={{
                  color: "#fff",
                  weight: 2,
                  fillColor: b._hasRealCoords ? "#1d6b38" : "#0f9a42",
                  fillOpacity: 0.9,
                }}
              >
                <Popup>
                  <div style={{ minWidth: "200px" }}>
                    <strong style={{ fontSize: "14px", color: "#1d6b38", display: "block", marginBottom: "4px" }}>
                      {b.name || b.trading_name || "Business"}
                    </strong>
                    {b.sector && (
                      <div style={{ fontSize: "12px", color: "#444", marginBottom: "2px" }}>
                        <b>Sector:</b> {b.sector}
                      </div>
                    )}
                    {b.area && (
                      <div style={{ fontSize: "12px", color: "#444", marginBottom: "2px" }}>
                        <b>Area:</b> {b.area}{b.ward ? ` · ${b.ward}` : ""}
                      </div>
                    )}
                    {b.address && (
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>
                        {b.address}
                      </div>
                    )}
                    {b.owner_name && (
                      <div style={{ fontSize: "12px", color: "#444", marginBottom: "2px" }}>
                        <b>Owner:</b> {b.owner_name}
                      </div>
                    )}
                    {b.phone && (
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>
                        <b>Phone:</b> {b.phone}
                      </div>
                    )}
                    {b.staff_band && (
                      <div style={{ fontSize: "12px", color: "#444", marginBottom: "2px" }}>
                        <b>Staff:</b> {b.staff_band}
                      </div>
                    )}
                    {b.status && (
                      <div style={{ fontSize: "11px", marginTop: "4px", textTransform: "capitalize", color: "#999" }}>
                        Status: {b.status}
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
