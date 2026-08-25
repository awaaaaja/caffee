<script setup lang="ts">
import { onMounted } from 'vue'
import Hero from '../components/home/Hero.vue'
import BrandIntro from '../components/home/BrandIntro.vue'
import ViennoiserieHighlight from '../components/home/ViennoiserieHighlight.vue'
import SignatureMenu from '../components/home/SignatureMenu.vue'
import GalleryPicks from '../components/home/GalleryPicks.vue'
import KitchenExperience from '../components/home/KitchenExperience.vue'
import PhotoboothPhotoshoot from '../components/home/PhotoboothPhotoshoot.vue'
import VideoSection from '../components/home/VideoSection.vue'
import ReviewCarousel from '../components/testimonials/ReviewCarousel.vue'
import ReservationCta from '../components/home/ReservationCta.vue'
import Navbar from '../components/layout/Navbar.vue'
import { useHomepageContent } from '../composables/useHomepageContent'

const { section, load } = useHomepageContent()

onMounted(() => {
  void load()
})
</script>

<template>
  <main class="bg-cream">
    <Navbar />
    <Hero />
    <VideoSection />
    <BrandIntro :section="section('story')" />
    <SignatureMenu />
    <ViennoiserieHighlight />
    <GalleryPicks />
    <KitchenExperience :section="section('experience')" />
    <PhotoboothPhotoshoot />
    <ReviewCarousel />
    <ReservationCta />
  </main>
</template>
