<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Database } from '../../types/database'

type LocationRow = Database['public']['Tables']['locations']['Row']

const props = defineProps<{
  location: LocationRow
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | null = null

onMounted(() => {
  if (!mapContainer.value || props.location.latitude === null || props.location.longitude === null) return

  const center: [number, number] = [Number(props.location.longitude), Number(props.location.latitude)]

  map = new MapLibreMap({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    },
    center,
    zoom: 15,
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

  const markerElement = document.createElement('div')
  markerElement.className = 'map-marker'
  markerElement.setAttribute('aria-label', props.location.name)
  new Marker({ element: markerElement, anchor: 'bottom' })
    .setLngLat(center)
    .addTo(map)
})

onUnmounted(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="relative overflow-hidden rounded-3xl border border-gold/15 shadow-[0_12px_40px_rgba(35,18,10,0.18)]">
    <div ref="mapContainer" class="h-[320px] w-full md:h-[420px]" aria-label="Map of Boulalulue location" />
    <a
      v-if="location.google_maps_url"
      :href="location.google_maps_url"
      target="_blank"
      rel="noopener noreferrer"
      class="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-espresso px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.16em] text-cream transition-colors duration-300 hover:bg-terracotta"
    >
      Get Directions
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-3.5 w-3.5" aria-hidden="true">
        <path d="M7 17 17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </a>
  </div>
</template>

<style scoped>
.map-marker {
  width: 22px;
  height: 22px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: #24150f;
  border: 2px solid #d7a83d;
  box-shadow: 0 6px 16px rgba(35, 18, 10, 0.35);
}

.map-marker::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 9999px;
  background: #d7a83d;
}
</style>
