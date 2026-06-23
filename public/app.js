/**
 * StreamLify Client Application Controller
 * Author: Hidz
 * Pure JS Premium Video Streaming Core
 */

// Application state registry
const STATE = {
  currentView: 'home',
  videos: [],
  currentPage: 1,
  activeVideo: null,
  favorites: JSON.parse(localStorage.getItem('streamlify_favs') || '[]'),
  liked: JSON.parse(localStorage.getItem('streamlify_likes') || '[]'),
  currentKeyword: "today's selection" // Default landing keyword
};

// Elements cache
const DOM = {
  loader: document.getElementById('loader'),
  errorMessage: document.getElementById('error-message'),
  errorText: document.getElementById('error-text'),
  homeView: document.getElementById('home-view'),
  watchView: document.getElementById('watch-view'),
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  homeGrid: document.getElementById('home-grid'),
  loadMoreContainer: document.getElementById('load-more-container'),
  btnLoadMore: document.getElementById('btn-load-more'),
  watchGrid: document.getElementById('watch-grid'),
  heroBannerSection: document.getElementById('hero-banner-section'),
  
  heroImg: document.getElementById('hero-img'),
  heroTitle: document.getElementById('hero-title'),
  heroChannel: document.getElementById('hero-channel'),
  heroDuration: document.getElementById('hero-duration'),
  heroDesc: document.getElementById('hero-desc'),
  heroPlayBtn: document.getElementById('hero-play-btn'),
  videoCountBadge: document.getElementById('video-count-badge'),
  
  playerContainer: document.getElementById('player-container'),
  watchTitle: document.getElementById('watch-title'),
  watchChannel: document.getElementById('watch-channel'),
  watchRating: document.getElementById('watch-rating'),
  watchDuration: document.getElementById('watch-duration'),
  watchDesc: document.getElementById('watch-desc'),
  qualitySelector: document.getElementById('quality-selector-container'),
  btnPlayHigh: document.getElementById('btn-play-high'),
  btnPlayLow: document.getElementById('btn-play-low'),

  favIconBg: document.getElementById('fav-icon-bg'),
  favText: document.getElementById('fav-text'),
  likeIconBg: document.getElementById('like-icon-bg'),
  creatorModal: document.getElementById('creator-modal')
};

const HOLLYWOOD_DESCRIPTIONS = [
  "Sebuah mahakarya sinematik mendebarkan yang dipenuhi ketegangan berkecepatan tinggi, akting brilian, dan plot twist epik yang tak terduga.",
  "Rasakan perjalanan visual imersif dengan resolusi ultra tajam. Alur cerita intensif yang akan membuat Anda terpaku di tempat duduk.",
  "Eksklusif di StreamLify. Ditayangkan perdana langsung dari sirkuit distribusi premium dengan audio dan visual berdefinisi tinggi.",
  "Konten trending paling populer yang sedang dibicarakan saat ini. Saksikan kualitas murni tanpa potongan.",
  "Sebuah pertunjukan luar biasa yang memadukan keindahan estetika gambar, durasi optimal, dan penyutradaraan profesional papan atas."
];

function getDynamicDesc(title, duration) {
  const seed = (title || "").length + parseInt(duration || "0") || 0;
  return HOLLYWOOD_DESCRIPTIONS[seed % HOLLYWOOD_DESCRIPTIONS.length] + ` Saksikan petualangan penuh selama ${duration || 'N/A'} dalam format Ultra HD.`;
}

function showLoader(show = true) {
  if (show) {
    DOM.loader.classList.remove('opacity-0', 'pointer-events-none');
    DOM.loader.classList.add('opacity-100');
  } else {
    DOM.loader.classList.remove('opacity-100');
    DOM.loader.classList.add('opacity-0', 'pointer-events-none');
  }
}

function showError(msg) {
  showLoader(false);
  DOM.errorText.innerText = msg || "Format data terjadi kegagalan muat. Periksa koneksi Anda.";
  DOM.errorMessage.classList.remove('hidden');
  DOM.errorMessage.classList.add('flex');
}

function hideError() {
  DOM.errorMessage.classList.add('hidden');
  DOM.errorMessage.classList.remove('flex');
}

async function init() {
  showLoader(true);
  hideError();
  
  const path = window.location.pathname;
  let isStream = false;
  let streamSlug = '';

  if (path.startsWith('/search/')) {
    STATE.currentKeyword = decodeURIComponent(path.split('/')[2]).replace(/\+/g, ' ');
  } else if (path.startsWith('/stream/')) {
    streamSlug = decodeURIComponent(path.split('/')[2]);
    isStream = true;
  } else {
    const params = new URLSearchParams(window.location.search);
    const directQ = params.get('q');
    if (directQ) {
      STATE.currentKeyword = directQ;
    }
  }

  window.addEventListener('popstate', () => {
    window.location.reload();
  });

  if (isStream) {
    await loadDirectStream(streamSlug);
  } else {
    await fetchVideos(STATE.currentKeyword, false, true);
  }
  showLoader(false);
}

async function loadDirectStream(slug) {
  showLoader(true);
  hideError();
  const searchQuery = slug.replace(/\+/g, ' ');
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();
    if (data.status && data.results && data.results.length > 0) {
      STATE.videos = data.results;
      await playVideo(data.results[0], true);
    } else {
      throw new Error("Video tidak ditemukan.");
    }
  } catch (error) {
    console.error("Direct stream failed: ", error);
    showError(error.message);
  }
}

async function fetchVideos(query, skipLoader = false, skipPushState = false, page = 1) {
  if (!skipLoader && page === 1) showLoader(true);
  hideError();

  if (page === 1) {
    STATE.currentPage = 1;
    if (!skipPushState) {
      if (query === "today's selection") {
        window.history.pushState({}, '', `/`);
      } else {
        const slug = query.replace(/\s+/g, '+');
        window.history.pushState({}, '', `/search/${slug}`);
      }
    }

    // Reset navbar active state
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.mob-nav-link').forEach(el => el.classList.remove('active'));
    
    if(query === "today's selection") {
      if(document.querySelectorAll('.nav-link')[0]) document.querySelectorAll('.nav-link')[0].classList.add('active'); // Beranda
      if(document.querySelectorAll('.mob-nav-link')[0]) document.querySelectorAll('.mob-nav-link')[0].classList.add('active'); // Beranda (Mobile)
    } else if(query === "Anime") {
      if(document.querySelectorAll('.nav-link')[1]) document.querySelectorAll('.nav-link')[1].classList.add('active'); 
      if(document.querySelectorAll('.mob-nav-link')[1]) document.querySelectorAll('.mob-nav-link')[1].classList.add('active'); 
    } else if(query === "Cinematic") {
      if(document.querySelectorAll('.nav-link')[2]) document.querySelectorAll('.nav-link')[2].classList.add('active'); 
      if(document.querySelectorAll('.mob-nav-link')[2]) document.querySelectorAll('.mob-nav-link')[2].classList.add('active'); 
    }
  } else {
    if (DOM.btnLoadMore) {
      DOM.btnLoadMore.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> MEMUAT...`;
    }
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}`);
    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(data.message || 'Gagal tersambung dengan server pencarian.');
    }

    if (page === 1) {
      STATE.videos = data.results || [];
      STATE.currentKeyword = query;
      
      if (DOM.videoCountBadge) {
        DOM.videoCountBadge.innerText = `${STATE.videos.length} DITEMUKAN`;
      }

      renderHomeGrid(false);
      renderHeroBanner();
      goHome();
    } else {
      const newVideos = data.results || [];
      STATE.videos = [...STATE.videos, ...newVideos];
      if (DOM.videoCountBadge) {
        DOM.videoCountBadge.innerText = `${STATE.videos.length} DITEMUKAN`;
      }
      renderHomeGrid(true, newVideos);
    }

    if (DOM.loadMoreContainer) {
      if (data.results && data.results.length > 0) {
        DOM.loadMoreContainer.classList.remove('hidden');
      } else {
        DOM.loadMoreContainer.classList.add('hidden');
      }
    }

  } catch (error) {
    console.error("Fetch videos failed: ", error);
    if (page === 1) showError(error.message);
    else toastMessage("Gagal memuat lebih banyak video.");
  } finally {
    if (!skipLoader && page === 1) showLoader(false);
    if (page > 1 && DOM.btnLoadMore) {
      DOM.btnLoadMore.innerHTML = `<i data-lucide="loader" class="w-5 h-5"></i> MUAT LEBIH BANYAK`;
      if(window.lucide) window.lucide.createIcons();
    }
  }
}

async function loadMoreVideos() {
  STATE.currentPage += 1;
  await fetchVideos(STATE.currentKeyword, true, true, STATE.currentPage);
}

function renderHomeGrid(append = false, newVideos = []) {
  if (!append) {
    DOM.homeGrid.innerHTML = '';
  }
  
  if (STATE.videos.length === 0) {
    DOM.homeGrid.innerHTML = `
      <div class="col-span-full py-24 text-center text-slate-500 text-sm font-semibold flex flex-col items-center">
        <i data-lucide="search-x" class="w-12 h-12 mb-4 text-slate-600 block animate-bounce"></i>
        Maaf, tidak ada hasil video untuk "${STATE.currentKeyword}". Coba istilah yang lain.
      </div>
    `;
    if(window.lucide) window.lucide.createIcons();
    return;
  }

  const gridTitle = document.getElementById('grid-title').querySelector('span');
  if(STATE.currentKeyword === "today's selection") {
    gridTitle.innerHTML = `Rekomendasimu`;
  } else {
    gridTitle.innerHTML = `Hasil Pencarian: <span class="text-sky-400 capitalize inline-block ml-2">${STATE.currentKeyword}</span>`;
  }

  const videosToRender = append ? newVideos : STATE.videos;
  videosToRender.forEach((video, index) => {
    const startIndex = append ? STATE.videos.length - newVideos.length : 0;
    const card = createVideoCard(video, startIndex + index, 'home');
    DOM.homeGrid.appendChild(card);
  });
  
  if(window.lucide) window.lucide.createIcons();
}

function renderHeroBanner(videoData = undefined) {
  const heroVideo = videoData !== undefined ? videoData : (STATE.videos.length > 0 ? STATE.videos[0] : null);
  
  if (!heroVideo) {
    if (DOM.heroBannerSection) DOM.heroBannerSection.classList.add('hidden');
    return;
  }
  
  if (DOM.heroBannerSection) DOM.heroBannerSection.classList.remove('hidden');
  
  DOM.heroTitle.innerText = heroVideo.title;
  DOM.heroImg.src = heroVideo.thumbnail || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop';
  DOM.heroDuration.innerText = heroVideo.duration;
  DOM.heroChannel.innerText = "Trd #" + (Math.floor(Math.random() * 9) + 1);
  DOM.heroDesc.innerText = getDynamicDesc(heroVideo.title, heroVideo.duration);
  
  DOM.heroPlayBtn.onclick = () => playVideo(heroVideo);
}

function createVideoCard(video, index, type = 'home') {
  const container = document.createElement('div');
  container.className = "group cursor-pointer card-hover bg-[#1e293b] rounded-2xl overflow-hidden border border-white/5 relative";
  container.innerHTML = `
    <div class="relative aspect-[16/10] overflow-hidden bg-[#0f172a]">
      <img 
        src="${video.thumbnail}" 
        loading="lazy"
        referrerpolicy="no-referrer"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.15] opacity-80 group-hover:opacity-100"
        onerror="this.src='https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&auto=format&fit=crop';"
      >
      <span class="absolute bottom-2 right-2 badge-blur text-white text-[10px] font-bold px-2 py-0.5 rounded">
        ${video.duration}
      </span>
      <div class="absolute inset-0 bg-[#0f172a]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div class="w-14 h-14 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(14,165,233,0.5)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
          <i data-lucide="play" class="w-6 h-6 fill-current"></i>
        </div>
      </div>
    </div>
    
    <div class="p-4">
      <h4 class="font-heading text-sm font-bold text-slate-300 group-hover:text-white transition-colors line-clamp-2 leading-snug tracking-wide" title="${video.title}">
        ${video.title}
      </h4>
      <div class="flex items-center justify-between mt-3 text-[10px] text-slate-500 font-bold tracking-wider">
        <span>HD STREAM</span>
        <span class="text-sky-500 flex items-center gap-1"><i data-lucide="star" class="w-3 h-3 fill-sky-500 text-sky-500"></i> ${(8 + (index % 2) + Math.random() * 0.9).toFixed(1)}</span>
      </div>
    </div>
  `;

  container.onclick = () => playVideo(video);
  return container;
}

async function playVideo(video, skipPushState = false) {
  showLoader(true);
  STATE.activeVideo = video;
  
  if (!skipPushState) {
    const slug = video.title.toLowerCase().replace(/[^a-z0-9]+/g, '+').replace(/(^\+|\+$)/g, '');
    window.history.pushState({}, '', `/stream/${slug}`);
  }

  document.title = `${video.title} - StreamLify`;
  
  DOM.watchTitle.innerText = video.title;
  DOM.watchChannel.innerText = "StreamLify CDN Server #" + (Math.floor(Math.random() * 12) + 1);
  DOM.watchRating.innerText = (8.5 + Math.random() * 1.4).toFixed(1);
  DOM.watchDuration.innerText = video.duration;
  DOM.watchDesc.innerText = getDynamicDesc(video.title, video.value || video.duration);

  try {
    const response = await fetch(`/api/stream?url=${encodeURIComponent(video.page_url)}`);
    const result = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || 'Gagal mengekstrak direct streaming link.');
    }

    const { download_url, high_quality_url, low_quality_url, quality } = result.data;
    
    if (high_quality_url || low_quality_url) {
      DOM.qualitySelector.classList.remove('hidden');
      DOM.qualitySelector.classList.add('flex');
      
      const setPlayerSource = (directUrl, qualityLabel) => {
        DOM.playerContainer.innerHTML = `
          <video 
            id="video-player" 
            class="w-full h-full rounded-2xl bg-black" 
            controls 
            autoplay 
            poster="${video.thumbnail || ''}"
            style="object-fit: contain;"
          >
            <source src="${directUrl}" type="video/mp4">
            Aliran video gagal dimuat oleh browser.
          </video>
        `;
      };

      if (high_quality_url) {
        DOM.btnPlayHigh.innerText = "HIGH QUALITY (720P+)";
        DOM.btnPlayHigh.className = "text-xs bg-sky-500 hover:bg-sky-400 text-white border border-sky-400 px-4 py-2 rounded-xl transition-all font-bold cursor-pointer";
        DOM.btnPlayHigh.onclick = () => {
          setPlayerSource(high_quality_url, "High");
          DOM.btnPlayHigh.classList.add('bg-sky-500', 'text-white', 'border-sky-400');
          DOM.btnPlayHigh.classList.remove('bg-white/5', 'text-slate-300', 'border-white/10');
          DOM.btnPlayLow.classList.remove('bg-sky-500', 'text-white', 'border-sky-400');
          DOM.btnPlayLow.classList.add('bg-white/5', 'text-slate-300', 'border-white/10');
        };
      } else {
        DOM.btnPlayHigh.classList.add('hidden');
      }

      if (low_quality_url) {
        DOM.btnPlayLow.innerText = "STANDARD (360P)";
        DOM.btnPlayLow.className = "text-xs bg-white/5 hover:bg-white/20 text-slate-300 border border-white/10 px-4 py-2 rounded-xl transition-all font-bold cursor-pointer";
        DOM.btnPlayLow.onclick = () => {
          setPlayerSource(low_quality_url, "Low");
          DOM.btnPlayLow.classList.add('bg-sky-500', 'text-white', 'border-sky-400');
          DOM.btnPlayLow.classList.remove('bg-white/5', 'text-slate-300', 'border-white/10');
          DOM.btnPlayHigh.classList.remove('bg-sky-500', 'text-white', 'border-sky-400');
          DOM.btnPlayHigh.classList.add('bg-white/5', 'text-slate-300', 'border-white/10');
        };
      } else {
        DOM.btnPlayLow.classList.add('hidden');
      }

      setPlayerSource(high_quality_url || download_url, "Default");

    } else {
      if (download_url) {
        DOM.qualitySelector.classList.add('hidden');
        DOM.playerContainer.innerHTML = `
          <video 
            id="video-player" 
            class="w-full h-full rounded-2xl bg-black" 
            controls 
            autoplay 
            poster="${video.thumbnail || ''}"
            style="object-fit: contain;"
          >
            <source src="${download_url}" type="video/mp4">
            Aliran video tidak didukung.
          </video>
        `;
      } else {
        DOM.qualitySelector.classList.add('hidden');
        DOM.playerContainer.innerHTML = `
          <iframe 
            id="video-player"
            class="w-full h-full rounded-2xl"
            src="${video.page_url}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        `;
      }
    }

    renderRelatedGrid(video);

    DOM.homeView.classList.add('hidden');
    DOM.watchView.classList.remove('hidden');
    
    updateFavoriteUI();
    updateLikeUI(false);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    console.error("Stream extraction failed:", error);
    showError(`Target CDN mendeteksi batasan regional. Gagal mengekstrak sesi.`);
  } finally {
    showLoader(false);
  }
}

function renderRelatedGrid(currentVideo) {
  DOM.watchGrid.innerHTML = '';
  const relevantList = STATE.videos.filter(v => v.page_url !== currentVideo.page_url).slice(0, 10);
  
  if (relevantList.length === 0) {
    DOM.watchGrid.innerHTML = `<p class="col-span-full py-4 text-slate-500 text-xs font-semibold">Tidak ditemukan kemiripan.</p>`;
    return;
  }

  relevantList.forEach((video, index) => {
    const card = createVideoCard(video, index, 'watch');
    DOM.watchGrid.appendChild(card);
  });
  
  if(window.lucide) window.lucide.createIcons();
}

function goHome(isFromSearch = false) {
  if (!isFromSearch) {
    if (STATE.currentKeyword && STATE.currentKeyword !== "today's selection") {
      const slug = STATE.currentKeyword.replace(/\s+/g, '+');
      window.history.pushState({}, '', `/search/${slug}`);
    } else {
      window.history.pushState({}, '', `/`);
    }
  }
  document.title = "StreamLify - Premium Streaming";
  DOM.watchView.classList.add('hidden');
  DOM.homeView.classList.remove('hidden');
  
  const videoEl = document.querySelector('video');
  if (videoEl) videoEl.pause();
  
  DOM.playerContainer.innerHTML = `
    <iframe 
      id="video-player"
      class="w-full h-full"
      src="" 
      frameborder="0" 
      allowfullscreen>
    </iframe>
  `;
}

function toggleFavorite() {
  if (!STATE.activeVideo) return;
  const idx = STATE.favorites.findIndex(v => v.page_url === STATE.activeVideo.page_url);
  
  if (idx > -1) {
    STATE.favorites.splice(idx, 1);
    toastMessage("Dihapus dari Daftar Tersimpan.");
  } else {
    STATE.favorites.push(STATE.activeVideo);
    toastMessage("Barhasil disimpan ke Koleksi.");
  }
  
  localStorage.setItem('streamlify_favs', JSON.stringify(STATE.favorites));
  updateFavoriteUI();
}

function updateFavoriteUI() {
  if (!STATE.activeVideo) return;
  const isFav = STATE.favorites.some(v => v.page_url === STATE.activeVideo.page_url);
  const favIconElem = document.getElementById('fav-icon');
  
  if (isFav) {
    if(favIconElem) {
      favIconElem.classList.add('text-sky-400', 'fill-sky-400');
    }
    DOM.favIconBg.classList.add('border-sky-500/50', 'bg-sky-500/10');
    DOM.favText.innerText = "Tersimpan";
    DOM.favText.className = "text-xs font-bold tracking-wide text-sky-400";
  } else {
    if(favIconElem) {
      favIconElem.classList.remove('text-sky-400', 'fill-sky-400');
    }
    DOM.favIconBg.classList.remove('border-sky-500/50', 'bg-sky-500/10');
    DOM.favText.innerText = "Daftarku";
    DOM.favText.className = "text-xs font-bold tracking-wide text-slate-400";
  }
}

function toggleLike() {
  if (!STATE.activeVideo) return;
  const isLiked = STATE.liked.includes(STATE.activeVideo.page_url);
  
  if (isLiked) {
    STATE.liked = STATE.liked.filter(url => url !== STATE.activeVideo.page_url);
    toastMessage("Rating ditarik.");
    updateLikeUI(false);
  } else {
    STATE.liked.push(STATE.activeVideo.page_url);
    toastMessage("Terima kasih atas ratingnya.");
    updateLikeUI(true);
  }
  
  localStorage.setItem('streamlify_likes', JSON.stringify(STATE.liked));
}

function updateLikeUI(liked) {
  if (!STATE.activeVideo) return;
  const isLiked = liked || STATE.liked.includes(STATE.activeVideo.page_url);
  const likeIconElem = document.getElementById('like-icon');

  if (isLiked) {
    if(likeIconElem) likeIconElem.classList.add('text-sky-400', 'fill-sky-400');
    DOM.likeIconBg.classList.add('border-sky-500/50', 'bg-sky-500/10');
  } else {
    if(likeIconElem) likeIconElem.classList.remove('text-sky-400', 'fill-sky-400');
    DOM.likeIconBg.classList.remove('border-sky-500/50', 'bg-sky-500/10');
  }
}

function showFavorites() {
  hideError();
  goHome();
  
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.mob-nav-link').forEach(el => el.classList.remove('active'));
  if(document.querySelectorAll('.nav-link')[3]) document.querySelectorAll('.nav-link')[3].classList.add('active'); // Favorit
  if(document.querySelectorAll('.mob-nav-link')[3]) document.querySelectorAll('.mob-nav-link')[3].classList.add('active'); // Favorit (Mobile)
  
  document.getElementById('grid-title').querySelector('span').innerHTML = `
    Koleksi Tersimpan
  `;
  if (DOM.videoCountBadge) DOM.videoCountBadge.innerText = `${STATE.favorites.length} ITEM`;
  
  DOM.homeGrid.innerHTML = '';
  
  if (STATE.favorites.length === 0) {
    if (DOM.loadMoreContainer) DOM.loadMoreContainer.classList.add('hidden');
    renderHeroBanner(null);
    DOM.homeGrid.innerHTML = `
      <div class="col-span-full py-24 text-center text-slate-500 text-sm font-semibold flex flex-col items-center">
        <i data-lucide="heart-crack" class="w-12 h-12 mb-4 text-slate-600 block"></i>
        Daftar favorit Anda masih kosong. Cari video untuk ditambahkan.
      </div>
    `;
    if(window.lucide) window.lucide.createIcons();
    return;
  }

  if (DOM.loadMoreContainer) DOM.loadMoreContainer.classList.add('hidden');
  renderHeroBanner(STATE.favorites[0]);

  STATE.favorites.forEach((video, index) => {
    const card = createVideoCard(video, index, 'home');
    DOM.homeGrid.appendChild(card);
  });
  if(window.lucide) window.lucide.createIcons();
}

function shareVideo() {
  if (!STATE.activeVideo) return;
  const dummyUrl = `${window.location.origin}/stream/${encodeURIComponent(STATE.activeVideo.title.toLowerCase().replace(/ /g, '+'))}`;
  
  navigator.clipboard.writeText(dummyUrl).then(() => {
    toastMessage("Tautan telah disalin.");
  }).catch(() => {
    const input = document.createElement('input');
    input.value = dummyUrl;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    toastMessage("Tautan telah disalin.");
  });
}

function toastMessage(text) {
  const existing = document.getElementById('toast-msg');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'toast-msg';
  container.className = "fixed bottom-8 right-8 z-[150] bg-[#1e293b] border border-white/10 text-white text-xs px-6 py-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-3 fade-in font-bold tracking-wide";
  container.innerHTML = `<i data-lucide="info" class="w-4 h-4 text-sky-400"></i> ${text}`;
  document.body.appendChild(container);
  
  if(window.lucide) window.lucide.createIcons();
  
  setTimeout(() => {
    container.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => container.remove(), 300);
  }, 2500);
}

DOM.searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = DOM.searchInput.value.trim();
  if (query) {
    fetchVideos(query);
  }
});

function retryConnection() {
  fetchVideos("today's selection");
}

function toggleCreatorInfo() {
  DOM.creatorModal.classList.toggle('hidden');
}

document.addEventListener('DOMContentLoaded', init);
