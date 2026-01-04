<template>
  <section class="hero">
    <div class="container is-widescreen">
      <div class="columns is-vcentered is-multiline">
        <!-- Konten Kiri -->
        <div class="column is-5-desktop is-12-mobile">
          <div class="hero-content">
            <h1 class="title hero-title">
              Infrastruktur Cloud
              <br />
              <span class="highlight-text">
                Untuk Bisnis yang Berkembang
              </span>
            </h1>

            <p class="subtitle hero-subtitle mt-4">
              VPS berbasis NVMe, jaringan 1 Gbps, dan panel manajemen modern —
              semua dalam satu layanan terintegrasi dengan harga transparan.
            </p>

            <div class="mt-6">
              <router-link to="/daftar" class="button cta-button">
                Mulai Sekarang
              </router-link>
            </div>
          </div>
        </div>

        <!-- Visual Kanan -->
        <div class="column is-7-desktop is-12-mobile">
          <div class="illustration-frame">
            <img
              src="../assets/hero.png"
              alt="Ilustrasi Infrastruktur Cloud"
              class="hero-image"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>



<style scoped>

.hero {
  background: linear-gradient(128deg, #f8f7ff 0%, #f0efff 45%, #b5b0e3ff 100%);
  padding: 5rem 1.25rem 8rem;
}

/* Content */
.hero-content {
  text-align: left;
}

/* Title */
.hero-title {
  font-weight: 800;
  font-size: 2.75rem;
  line-height: 1.15;
  letter-spacing: -0.5px;
  color: #d838e4ff;
}
.highlight-text {
  color: #5b3e96ff;
}

.hero-subtitle {
  font-weight: 400;
  color: #3a3a4a;
  line-height: 1.65;
}

/* CTA */
.cta-button {
  background: #6a5acd;
  color: #fff;
  font-weight: 600;
  font-size: 1.05rem;
  padding: 0.85rem 2.2rem;
  border-radius: 8px;
  transition: all 0.25s ease;
}
.cta-button:hover {
  background: #5a4dbd;
  transform: translateY(-2px);
}

/* Image */
.illustration-frame {
  display: flex;
  justify-content: center;
  align-items: center;
}
.hero-image {
  width: 85%;
  max-width: 520px;
  height: auto;
}

/* =====================
   RESPONSIVE BREAKPOINTS
   ===================== */

/* Tablet */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 2.25rem;
  }
}

/* Mobile */
@media (max-width: 768px) {
  .hero {
    padding: 4rem 1rem 6rem;
  }

  .hero-content {
    text-align: center;
  }

  .hero-title {
    font-size: 1.9rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .cta-button {
    width: 100%;
    max-width: 320px;
  }

  .illustration-frame {
    margin-top: 2.5rem;
  }

  .hero-image {
    width: 100%;
  }
}

</style>
