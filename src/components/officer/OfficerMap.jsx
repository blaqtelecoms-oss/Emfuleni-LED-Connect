import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { useLedList } from "@/hooks/useLedList";
import PageHeader from "@/components/PageHeader";
import { SectionLoading, SectionEmpty } from "@/components/SectionStates";
import { Store } from "lucide-react";

// Emfuleni Local Municipality — Vereeniging / Vaal Triangle
const EMFULENI_CENTER = [-26.6736, 27.9261];
const EMFULENI_ZOOM = 12;

// Custom pin marker for businesses (brand green)
const businessIcon = L.divIcon({
  className: "led-biz-pin",
  html: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s-7-7.58-7-12a7 7 0 0 1 14 0c0 4.42-7 12-7 12z" fill="#1d6b38" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="3" fill="#fff"/>
  </svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

export default function OfficerMap() {
  const { data, loading } = useLedList(() =>
    Promise.all([
      base44.entities.Business.list().catch(() => []),
      base44.entities.Ward.list().catch(() => []),
    ])
  );

  const businesses = data?.[0] || [];
  const wards = data?.[1] || [];

  // Only businesses with valid coordinates
  const mapped = useMemo(
    () =>
      businesses.filter(
        (b) =>
          b.latitude != null &&
          b.longitude != null &&
          !isNaN(b.latitude) &&
          !isNaN(b.longitude)
      ),
    [businesses]
  );

  // Unique areas that have businesses but no coordinates (for fallback display)
  const areaCounts = useMemo(() => {
    const counts = {};
    businesses.forEach((b) => {
      const area = b.area || b.ward || "Unknown";
      counts[area] = (counts[area] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [businesses]);

  if (loading) return <SectionLoading />;

  return (
    <div>
      <PageHeader title="Map" subtitle="Business locations across Emfuleni's wards." />

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="led-chip on flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5" />
          {mapped.length} pinned
        </span>
        <span className="led-chip">
          {businesses.length} total businesses
        </span>
        {wards.length > 0 && <span className="led-chip">{wards.length} wards</span>}
      </div>

      {businesses.length === 0 ? (
        <SectionEmpty>No business data yet.</SectionEmpty>
      ) : (
        <>
          {/* OpenStreetMap */}
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
                <Marker key={b.id} position={[b.latitude, b.longitude]} icon={businessIcon}>
                  <Popup>
                    <div style={{ minWidth: "180px" }}>
                      <strong style={{ fontSize: "14px", color: "#1d6b38" }}>
                        {b.name || b.trading_name || "Business"}
                      </strong>
                      {b.area && (
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                          {b.area}{b.ward ? ` · ${b.ward}` : ""}
                        </div>
                      )}
                      {b.sector && (
                        <div style={{ fontSize: "12px", color: "#666" }}>{b.sector}</div>
                      )}
                      {b.address && (
                        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                          {b.address}
                        </div>
                      )}
                      {b.status && (
                        <div style={{ fontSize: "11px", marginTop: "4px", textTransform: "capitalize" }}>
                          Status: {b.status}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Fallback: show a circle marker at Emfuleni center if no pinned businesses */}
              {mapped.length === 0 && (
                <CircleMarker
                  center={EMFULENI_CENTER}
                  radius={20}
                  pathOptions={{ color: "#1d6b38", fillColor: "#1d6b38", fillOpacity: 0.2 }}
                >
                  <Popup>Emfuleni Local Municipality</Popup>
                </CircleMarker>
              )}
            </MapContainer>
          </div>

          {/* Area summary for businesses without coordinates */}
          {mapped.length === 0 && areaCounts.length > 0 && (
            <div className="mt-4 led-box">
              <h3 className="text-sm font-bold text-ink mb-2">
                Businesses by area (no coordinates yet)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {areaCounts.map(([area, count]) => (
                  <div key={area} className="rounded-lg p-2.5 bg-soft">
                    <span className="text-xs font-semibold text-ink block">{area}</span>
                    <b className="text-sm text-brand">{count}</b>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mapped.length > 0 && mapped.length < businesses.length && (
            <p className="text-xs text-mute mt-2">
              Showing {mapped.length} of {businesses.length} businesses.{" "}
              {businesses.length - mapped.length} have no coordinates yet.
            </p>
          )}
        </>
      )}
    </div>
  );
}
