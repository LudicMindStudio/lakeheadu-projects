// Pin placement for the entry form: a small map of the region. Clicking it
// sets the pin's coordinates and the marker follows the form's values. The
// coordinate fields above stay the precise path.

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import { TILE_TEMPLATE } from "../../data/mapConfig.js";

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const RECENTER_DEGREES = 0.35;

export default function LocationPicker({ lat, lng, fallback, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const latNum = String(lat).trim() !== "" && Number.isFinite(Number(lat)) ? Number(lat) : null;
  const lngNum = String(lng).trim() !== "" && Number.isFinite(Number(lng)) ? Number(lng) : null;
  const shown = {
    lat: latNum ?? fallback.lat,
    lng: lngNum ?? fallback.lng,
  };
  const shownRef = useRef(shown);
  useEffect(() => {
    shownRef.current = shown;
  });

  useEffect(() => {
    if (mapRef.current || !containerRef.current) {
      return undefined;
    }
    let map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            base: {
              type: "raster",
              tiles: [TILE_TEMPLATE],
              tileSize: 256,
              minzoom: 6,
              maxzoom: 11,
            },
          },
          layers: [{ id: "base", type: "raster", source: "base" }],
        },
        center: [shownRef.current.lng, shownRef.current.lat],
        zoom: 9,
        minZoom: 6.45,
        maxZoom: 11.5,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        fadeDuration: 0,
        scrollZoom: false, // the form still scrolls under the pointer
      });
    } catch {
      setFailed(true);
      return undefined;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.on("error", () => {});

    const el = document.createElement("div");
    el.className = "pick-pin";
    markerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([shownRef.current.lng, shownRef.current.lat])
      .addTo(map);

    map.on("click", (event) => {
      onChangeRef.current(
        Number(event.lngLat.lat.toFixed(5)),
        Number(event.lngLat.lng.toFixed(5)),
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The marker follows the form, and the view follows when the pin moves far.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) {
      return;
    }
    marker.setLngLat([shown.lng, shown.lat]);
    const center = map.getCenter();
    if (
      Math.abs(center.lat - shown.lat) > RECENTER_DEGREES ||
      Math.abs(center.lng - shown.lng) > RECENTER_DEGREES
    ) {
      map.easeTo({ center: [shown.lng, shown.lat], duration: 400 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown.lat, shown.lng]);

  return (
    <div className={`form-map-pick${failed ? " is-failed" : ""}`}>
      <div className="form-map-pick-canvas" ref={containerRef} />
      {failed && (
        <p className="form-map-pick-note">
          The map preview is not available here — set the coordinates above.
        </p>
      )}
    </div>
  );
}
