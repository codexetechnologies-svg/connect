'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { ExternalLink, MapPin, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Supplier } from '@/lib/data/mock-data';
import { distanceInKilometers } from '@/lib/geo';
import { useLanguage } from '@/features/i18n/language-provider';

const shopLocation = {
  lat: 9.9252,
  lng: 78.1198,
  label: 'Example medical shop · Madurai'
};

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function getMarkerColor(supplier: Supplier) {
  if (supplier.stock === 'Out of Stock') return '#DC2626';
  if (supplier.stock === 'Low Stock') return '#D97706';
  return '#16A34A';
}

function createInfoContent(supplier: Supplier, distanceKm: number, translate: (text: string) => string) {
  const content = document.createElement('div');
  content.className = 'min-w-48 px-1 py-1';

  const name = document.createElement('strong');
  name.className = 'block text-sm text-slate-900';
  name.textContent = supplier.name;

  const details = document.createElement('span');
  details.className = 'mt-1 block text-xs text-slate-600';
  details.textContent = `${supplier.city} · ${distanceKm} ${translate('km')} · ${translate(supplier.stock)}`;

  content.append(name, details);
  return content;
}

export function GoogleSupplierMap({ suppliers }: { suppliers: Supplier[] }) {
  const { t } = useLanguage();
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'missing-key' | 'error'>(
    apiKey ? 'loading' : 'missing-key'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const mapElement = mapElementRef.current;
    if (!apiKey || !mapElement) return;

    let disposed = false;
    const markers = new Map<string, google.maps.Marker>();
    const circles: google.maps.Circle[] = [];

    const initializeMap = async () => {
      try {
        setOptions({ key: apiKey, v: 'weekly' });
        const { Map: GoogleMap, InfoWindow } = (await importLibrary(
          'maps'
        )) as google.maps.MapsLibrary;
        if (disposed) return;

        const map = new GoogleMap(mapElement, {
          center: shopLocation,
          zoom: 8,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true
        });
        const infoWindow = new InfoWindow();
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(shopLocation);

        new google.maps.Marker({
          map,
          position: shopLocation,
          title: shopLocation.label,
          label: { text: 'S', color: '#ffffff', fontWeight: '700' }
        });

        for (const supplier of suppliers) {
          const position = supplier.coordinates;
          const distanceKm = distanceInKilometers(shopLocation, position);
          const color = getMarkerColor(supplier);
          const marker = new google.maps.Marker({
            map,
            position,
            title: supplier.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 9
            }
          });

          marker.addListener('click', () => {
            setSelectedId(supplier.id);
            infoWindow.setContent(createInfoContent(supplier, distanceKm, t));
            infoWindow.open({ map, anchor: marker });
          });

          markers.set(supplier.id, marker);
          bounds.extend(position);
          circles.push(
            new google.maps.Circle({
              map,
              center: position,
              radius: supplier.deliveryRadiusKm * 1000,
              fillColor: color,
              fillOpacity: 0.07,
              strokeColor: color,
              strokeOpacity: 0.35,
              strokeWeight: 1,
              clickable: false
            })
          );
        }

        map.fitBounds(bounds, 56);
        mapRef.current = map;
        markersRef.current = markers;
        infoWindowRef.current = infoWindow;
        boundsRef.current = bounds;
        setMapStatus('ready');
      } catch (error) {
        if (disposed) return;
        setErrorMessage(
          error instanceof Error ? error.message : 'Google Maps could not be loaded.'
        );
        setMapStatus('error');
      }
    };

    void initializeMap();

    return () => {
      disposed = true;
      infoWindowRef.current?.close();
      markers.forEach((marker) => {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      circles.forEach((circle) => circle.setMap(null));
      mapElement.replaceChildren();
      markersRef.current.clear();
      mapRef.current = null;
      boundsRef.current = null;
    };
  }, [suppliers, t]);

  const focusSupplier = useCallback((supplier: Supplier) => {
    const map = mapRef.current;
    const marker = markersRef.current.get(supplier.id);
    if (!map || !marker) return;

    const distanceKm = distanceInKilometers(shopLocation, supplier.coordinates);
    setSelectedId(supplier.id);
    map.panTo(supplier.coordinates);
    map.setZoom(13);
    infoWindowRef.current?.setContent(createInfoContent(supplier, distanceKm, t));
    infoWindowRef.current?.open({ map, anchor: marker });
  }, [t]);

  const fitAllSuppliers = useCallback(() => {
    const map = mapRef.current;
    const bounds = boundsRef.current;
    if (!map || !bounds) return;

    setSelectedId(null);
    infoWindowRef.current?.close();
    map.fitBounds(bounds, 56);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="card relative h-[540px] overflow-hidden p-0">
        <div ref={mapElementRef} className="h-full w-full" aria-label="Google map of supplier locations" />

        <div className="absolute left-4 top-4 z-10 rounded-xl border border-brand-border bg-white/95 px-3 py-2 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy">{t('Shop location')}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">{t('Madurai City · Example location')}</p>
        </div>

        {mapStatus !== 'ready' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/95 p-6 text-center">
            <div className="max-w-md">
              <MapPin aria-hidden="true" className="mx-auto h-8 w-8 text-brand-navy" />
              {mapStatus === 'loading' ? (
                <>
                  <h2 className="mt-3 text-lg font-bold text-slate-900">{t('Loading Google Maps')}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t('Connecting to the Google Maps JavaScript API.')}</p>
                </>
              ) : mapStatus === 'missing-key' ? (
                <>
                  <h2 className="mt-3 text-lg font-bold text-slate-900">{t('Google Maps API key required')}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {t('Add Google Maps API key to')} <code className="rounded bg-slate-200 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> <code className="ml-1 rounded bg-slate-200 px-1">.env.local</code>. {t('Enable Maps JavaScript API and billing for that key.')}
                  </p>
                  <a
                    href="https://console.cloud.google.com/google/maps-apis"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:underline"
                  >
                    {t('Set up Google Maps in Cloud Console')}
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  </a>
                </>
              ) : (
                <>
                  <h2 className="mt-3 text-lg font-bold text-slate-900">{t('Google Maps could not load')}</h2>
                  <p className="mt-1 break-words text-sm text-slate-600">{errorMessage}</p>
                </>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${shopLocation.lat},${shopLocation.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:underline"
              >
                {t('Open Madurai in Google Maps')}
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={fitAllSuppliers}
          disabled={mapStatus !== 'ready'}
          className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          {t('Fit all suppliers')}
        </button>
      </div>

      <aside className="space-y-3" aria-label="Supplier locations">
        {suppliers.map((supplier) => {
          const distanceKm = distanceInKilometers(shopLocation, supplier.coordinates);
          const isSelected = selectedId === supplier.id;
          const className = `block w-full rounded-2xl border p-4 text-left transition ${
            isSelected ? 'border-brand-navy bg-blue-50 ring-1 ring-brand-navy' : 'border-brand-border bg-white hover:border-slate-300'
          }`;
          const content = (
            <>
              <span className="flex items-center justify-between gap-2">
                <span>
                  <span className="block font-semibold text-slate-900">{supplier.name}</span>
                  <span className="block text-sm text-slate-500">{supplier.city}</span>
                </span>
                <span className={`badge ${supplier.stock === 'In Stock' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : supplier.stock === 'Low Stock' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {t(supplier.stock)}
                </span>
              </span>
              <span className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
                <span>{t('Distance')}</span>
                <span className="text-right font-medium text-brand-navy">{distanceKm} km</span>
                <span>{t('Coverage')}</span>
                <span className="text-right font-medium text-brand-navy">{supplier.deliveryRadiusKm} km</span>
              </span>
            </>
          );

          return mapStatus === 'ready' ? (
            <button
              key={supplier.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => focusSupplier(supplier)}
              className={className}
            >
              {content}
            </button>
          ) : (
            <a
              key={supplier.id}
              href={`https://www.google.com/maps/search/?api=1&query=${supplier.coordinates.lat},${supplier.coordinates.lng}`}
              target="_blank"
              rel="noreferrer"
              className={className}
            >
              {content}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-navy">
                {t('Open location in Google Maps')} <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
            </a>
          );
        })}
      </aside>
    </div>
  );
}
