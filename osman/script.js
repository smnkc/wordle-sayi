class SayiTahminOyunu {
    constructor() {
        this.hedefSayi = '';
        this.tahminler = [];
        this.maxTahmin = 6;
        this.kalanIpucu = 3;
        this.sesAcik = true;
        this.basamakSayisi = 4;
        this.toplamOyun = 0;
        this.kazanilanOyun = 0;
        this.toplamPuan = 0;
        this.toplamDeneme = 0;
        
        // HTML elementlerini al
        this.inputs = Array.from(document.querySelectorAll('.digit-input'));
        this.tahminBtn = document.getElementById('guess-btn');
        this.yeniOyunBtn = document.getElementById('new-game-btn');
        this.sonuclarDiv = document.getElementById('results');
        this.kalanHakSpan = document.getElementById('attempts');
        this.ipucuBtn = document.getElementById('hint-btn');
        this.ipucuText = document.getElementById('current-hint');
        this.sesBtn = document.getElementById('sound-btn');
        this.helpBtn = document.getElementById('help-btn');
        this.helpModal = document.getElementById('help-modal');
        this.zorlukSelect = document.getElementById('difficulty-select');
        this.basamakSelect = document.getElementById('digit-count-select');
        this.gameStats = document.getElementById('game-stats');
        this.currentScore = document.getElementById('current-score');
        
        // Ses elementleri
        this.tikSesi = document.getElementById('tick-sound');
        this.kazanmaSesi = document.getElementById('win-sound');
        this.kaybetmeSesi = document.getElementById('lose-sound');
        
        // Seslerin yüklenmesini bekle
        Promise.all([
            this.sesYukle(this.tikSesi),
            this.sesYukle(this.kazanmaSesi),
            this.sesYukle(this.kaybetmeSesi)
        ]).catch(error => {
            console.error('Ses dosyaları yüklenemedi:', error);
            this.sesAcik = false;
            this.sesBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            this.mesajGoster('Ses dosyaları yüklenemedi, ses kapatıldı.');
        });
        
        // Event listenerları ekle
        this.eventListenerlariEkle();
        
        // Yeni oyun başlat
        this.yeniOyunBaslat();
    }

    eventListenerlariEkle() {
        // Input olayları
        this.inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => this.rakamGirisi(e, index));
            input.addEventListener('keydown', (e) => this.tusKontrolu(e, index));
        });

        // Buton olayları
        this.tahminBtn.addEventListener('click', () => this.tahminEt());
        this.yeniOyunBtn.addEventListener('click', () => this.yeniOyunBaslat());
        this.ipucuBtn.addEventListener('click', () => this.ipucuGoster());
        this.sesBtn.addEventListener('click', () => this.sesiToggle());
        this.helpBtn.addEventListener('click', () => this.helpModal.classList.add('active'));
        
        // Modal kapatma
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Modal dışına tıklama
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Zorluk seviyesi değişimi
        this.zorlukSelect.addEventListener('change', () => {
            this.zorlukDegistir();
            this.yeniOyunBaslat();
        });

        // Tema değiştirme
        document.querySelector('.theme-switch').addEventListener('click', () => this.temaDegistir());

        // Klavye kısayolları
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.ipucuGoster();
            }
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });

        // Basamak sayısı değişimi
        this.basamakSelect.addEventListener('change', () => {
            this.basamakSayisiDegistir();
            this.yeniOyunBaslat();
        });
    }

    zorlukDegistir() {
        const zorluk = this.zorlukSelect.value;
        switch(zorluk) {
            case 'easy':
                this.maxTahmin = 8;
                break;
            case 'medium':
                this.maxTahmin = 6;
                break;
            case 'hard':
                this.maxTahmin = 4;
                break;
        }
        this.kalanHakGuncelle();
    }

    temaDegistir() {
        document.body.dataset.theme = document.body.dataset.theme === 'dark' ? '' : 'dark';
        const icon = document.querySelector('.theme-switch i');
        icon.className = document.body.dataset.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    sesiToggle() {
        this.sesAcik = !this.sesAcik;
        this.sesBtn.innerHTML = `<i class="fas fa-volume-${this.sesAcik ? 'up' : 'mute'}"></i>`;
    }

    sesYukle(audioElement) {
        return new Promise((resolve, reject) => {
            if (!audioElement) {
                reject(new Error('Ses elementi bulunamadı'));
                return;
            }

            const timeoutId = setTimeout(() => {
                reject(new Error('Ses yükleme zaman aşımı'));
            }, 5000);

            const successHandler = () => {
                clearTimeout(timeoutId);
                resolve();
            };

            const errorHandler = (error) => {
                clearTimeout(timeoutId);
                console.error(`Ses yükleme hatası: ${audioElement.src}`, error);
                reject(error);
            };

            audioElement.addEventListener('canplaythrough', successHandler, { once: true });
            audioElement.addEventListener('error', errorHandler, { once: true });

            try {
                audioElement.load();
            } catch (error) {
                errorHandler(error);
            }
        });
    }

    sesOynat(element) {
        if (this.sesAcik && element) {
            try {
                element.currentTime = 0;
                element.volume = 0.5;
                const playPromise = element.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('Ses çalma hatası:', error);
                        // Otomatik oynatma engellendiyse sesi kapatıyoruz
                        if (error.name === 'NotAllowedError') {
                            this.sesAcik = false;
                            this.sesBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                            this.mesajGoster('Ses çalma engellendi, ses kapatıldı.');
                        }
                    });
                }
            } catch (error) {
                console.error('Ses çalma hatası:', error);
            }
        }
    }

    ipucuGoster() {
        if (this.kalanIpucu <= 0) {
            this.mesajGoster('İpucu hakkınız kalmadı!');
            return;
        }

        const ipucular = [
            `Sayının toplamı: ${this.hedefSayi.split('').reduce((a, b) => parseInt(a) + parseInt(b), 0)}`,
            `En büyük rakam: ${Math.max(...this.hedefSayi.split(''))}`,
            `İlk rakam ${parseInt(this.hedefSayi[0]) % 2 === 0 ? 'çift' : 'tek'}`,
            `Son rakam ${parseInt(this.hedefSayi[this.basamakSayisi-1]) % 2 === 0 ? 'çift' : 'tek'}`,
            `Ortadaki ${this.basamakSayisi === 3 ? 'rakam' : 'rakamlardan biri'} ${parseInt(this.hedefSayi[Math.floor(this.basamakSayisi/2)]) % 2 === 0 ? 'çift' : 'tek'}`
        ];

        const ipucu = ipucular[Math.floor(Math.random() * ipucular.length)];
        this.ipucuText.textContent = ipucu;
        this.kalanIpucu--;
        this.ipucuBtn.innerHTML = `<i class="fas fa-lightbulb"></i> İpucu (${this.kalanIpucu})`;
    }

    rakamGirisi(e, index) {
        let deger = e.target.value;
        
        // Birden fazla rakam girildiğinde
        if (deger.length > 1) {
            const rakamlar = deger.split('').filter(char => /^\d$/.test(char));
            
            // Her bir rakamı sırayla kutulara dağıt
            for (let i = 0; i < rakamlar.length && index + i < this.inputs.length; i++) {
                const rakam = rakamlar[i];
                const mevcutTahmin = this.inputs.map(input => input.value);
                
                // Tekrar kontrolü
                if (!mevcutTahmin.includes(rakam) || mevcutTahmin.indexOf(rakam) === index + i) {
                    this.inputs[index + i].value = rakam;
                    this.inputs[index + i].classList.add('bounce');
                    setTimeout(() => {
                        this.inputs[index + i].classList.remove('bounce');
                    }, 300);
                    
                    if (index + i + 1 < this.inputs.length) {
                        this.inputs[index + i + 1].focus();
                    }
                }
            }
            
            // Input değerini ilk rakama ayarla
            e.target.value = rakamlar[0] || '';
            return;
        }

        // Tek rakam girişi
        if (!/^\d$/.test(deger)) {
            e.target.value = '';
            e.target.classList.add('shake');
            setTimeout(() => {
                e.target.classList.remove('shake');
            }, 500);
            return;
        }
        
        // Tekrar kontrolü
        const mevcutTahmin = this.inputs.map(input => input.value);
        if (mevcutTahmin.indexOf(deger) !== -1 && mevcutTahmin.indexOf(deger) !== index) {
            e.target.value = '';
            e.target.classList.add('shake');
            setTimeout(() => {
                e.target.classList.remove('shake');
            }, 500);
            this.mesajGoster('Her rakam sadece bir kez kullanılabilir!');
            return;
        }

        // Rakam girildiğinde bounce efekti
        e.target.classList.add('bounce');
        setTimeout(() => {
            e.target.classList.remove('bounce');
        }, 300);

        // Sonraki kutuya geç
        if (index < this.inputs.length - 1) {
            this.inputs[index + 1].focus();
        }
    }

    tusKontrolu(e, index) {
        // Enter tuşu
        if (e.key === 'Enter') {
            e.preventDefault();
            const hepsiDolu = this.inputs.every(input => input.value !== '');
            if (hepsiDolu) {
                this.tahminEt();
            } else {
                this.mesajGoster('Lütfen tüm rakamları girin!');
            }
            return;
        }

        // Backspace tuşu
        if (e.key === 'Backspace') {
            if (!e.target.value && index > 0) {
                e.preventDefault();
                this.inputs[index - 1].focus();
                this.inputs[index - 1].value = '';
            }
            return;
        }

        // Yön tuşları
        if (e.key === 'ArrowRight' && index < this.inputs.length - 1) {
            e.preventDefault();
            this.inputs[index + 1].focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            this.inputs[index - 1].focus();
        }
    }

    tahminEt() {
        const tahmin = this.inputs.map(input => input.value).join('');
        
        if (tahmin.length !== this.basamakSayisi) {
            this.mesajGoster('Lütfen doğru sayıyı girin!');
            return;
        }
        
        if (!/^\d+$/.test(tahmin)) {
            this.mesajGoster('Lütfen sadece rakam girin!');
            return;
        }
        
        if (new Set(tahmin).size !== this.basamakSayisi) {
            this.mesajGoster('Rakamlar tekrar edemez!');
            return;
        }

        // Kalan hakkı kontrol et
        if (this.tahminler.length >= this.maxTahmin) {
            this.oyunBitti(`Oyun bitti! Doğru sayı: ${this.hedefSayi}`, false);
            return;
        }

        // Tahmin sayısını artır
        this.tahminler.push(tahmin);
        this.kalanHakGuncelle();
        
        const sonuc = this.tahminKontrol(tahmin);
        this.tahminGoster(tahmin, sonuc);

        // Tahmin sesi çal
        this.tikSesi.volume = 0.5;
        this.sesOynat(this.tikSesi);

        // Oyun durumunu kontrol et
        if (tahmin === this.hedefSayi) {
            this.oyunBitti('Tebrikler! Sayıyı buldunuz! 🎉', true);
        } else if (this.tahminler.length >= this.maxTahmin) {
            this.oyunBitti(`Oyun bitti! Doğru sayı: ${this.hedefSayi}`, false);
        }

        this.inputlariTemizle();
    }

    tahminKontrol(tahmin) {
        const sonuc = [];
        const hedefRakamlar = this.hedefSayi.split('');
        const tahminRakamlar = tahmin.split('');
        
        // Doğru yerdeki rakamları kontrol et
        for (let i = 0; i < this.basamakSayisi; i++) {
            if (tahminRakamlar[i] === hedefRakamlar[i]) {
                sonuc[i] = 'correct';
                hedefRakamlar[i] = null;
                tahminRakamlar[i] = null;
            }
        }
        
        // Yanlış yerdeki rakamları kontrol et
        for (let i = 0; i < this.basamakSayisi; i++) {
            if (tahminRakamlar[i] === null) continue;
            
            const hedefIndex = hedefRakamlar.indexOf(tahminRakamlar[i]);
            if (hedefIndex !== -1) {
                sonuc[i] = 'wrong-position';
                hedefRakamlar[hedefIndex] = null;
            } else {
                sonuc[i] = 'incorrect';
            }
        }
        
        return sonuc;
    }

    tahminGoster(tahmin, sonuc) {
        const tahminSatiri = document.createElement('div');
        tahminSatiri.className = 'guess-row';
        
        for (let i = 0; i < this.basamakSayisi; i++) {
            const kutu = document.createElement('div');
            kutu.className = `guess-box ${sonuc[i]}`;
            kutu.textContent = tahmin[i];
            tahminSatiri.appendChild(kutu);
        }
        
        this.sonuclarDiv.insertBefore(tahminSatiri, this.sonuclarDiv.firstChild);
    }

    yeniOyunBaslat() {
        this.hedefSayi = this.rastgeleSayiUret();
        this.tahminler = [];
        this.kalanIpucu = 3;
        this.sonuclarDiv.innerHTML = '';
        this.inputlariTemizle();
        this.kalanHakGuncelle();
        this.ipucuText.textContent = 'İpucu almak için tıklayın!';
        this.ipucuBtn.innerHTML = `<i class="fas fa-lightbulb"></i> İpucu (${this.kalanIpucu})`;
        this.tahminBtn.disabled = false;
        this.ipucuBtn.disabled = false;
        
        // Yardım modalını güncelle
        const helpText = document.querySelector('.help-content p');
        if (helpText) {
            helpText.textContent = `${this.basamakSayisi} basamaklı gizli sayıyı bulmaya çalışın!`;
        }
        
        console.log('Hedef sayı:', this.hedefSayi); // Debug için
    }

    rastgeleSayiUret() {
        let rakamlar = Array.from({length: 10}, (_, i) => i);
        let sonuc = '';
        for (let i = 0; i < this.basamakSayisi; i++) {
            const rastgeleIndex = Math.floor(Math.random() * rakamlar.length);
            sonuc += rakamlar[rastgeleIndex];
            rakamlar.splice(rastgeleIndex, 1);
        }
        return sonuc;
    }

    inputlariTemizle() {
        this.inputs.forEach(input => {
            input.value = '';
            input.disabled = false;
        });
        this.inputs[0].focus();
    }

    kalanHakGuncelle() {
        const kalanHak = Math.max(0, this.maxTahmin - this.tahminler.length);
        this.kalanHakSpan.textContent = kalanHak;
    }

    oyunBitti(mesaj, kazandi = false) {
        this.mesajGoster(mesaj);
        this.inputs.forEach(input => input.disabled = true);
        this.tahminBtn.disabled = true;
        this.ipucuBtn.disabled = true;

        // Container'a animasyon ekle
        const container = document.querySelector('.container');
        container.classList.add(kazandi ? 'win' : 'lose');
        
        // Animasyon bitince sınıfı kaldır
        setTimeout(() => {
            container.classList.remove('win', 'lose');
        }, 1000);

        // Kazanma veya kaybetme sesini çal
        if (kazandi) {
            this.kazanmaSesi.volume = 0.3;
            this.sesOynat(this.kazanmaSesi);
        } else {
            this.kaybetmeSesi.volume = 0.3;
            this.sesOynat(this.kaybetmeSesi);
        }

        // İstatistikleri güncelle
        this.istatistikleriGuncelle(kazandi);
        
        // Mevcut puanı göster
        this.currentScore.textContent = kazandi ? this.puanHesapla() : 0;
    }

    mesajGoster(mesaj) {
        const mesajDiv = document.createElement('div');
        mesajDiv.style.position = 'fixed';
        mesajDiv.style.top = '20px';
        mesajDiv.style.left = '50%';
        mesajDiv.style.transform = 'translateX(-50%)';
        mesajDiv.style.backgroundColor = '#333';
        mesajDiv.style.color = 'white';
        mesajDiv.style.padding = '1rem 2rem';
        mesajDiv.style.borderRadius = '5px';
        mesajDiv.style.zIndex = '1000';
        mesajDiv.textContent = mesaj;
        mesajDiv.classList.add('fade-in-up');
        
        document.body.appendChild(mesajDiv);
        
        // Çıkış animasyonu
        setTimeout(() => {
            mesajDiv.classList.add('fade-out');
            setTimeout(() => mesajDiv.remove(), 500);
        }, 2500);
    }

    basamakSayisiDegistir() {
        this.basamakSayisi = parseInt(this.basamakSelect.value);
        
        // Input alanlarını güncelle
        const inputArea = document.querySelector('.input-area');
        inputArea.innerHTML = '';
        
        for (let i = 0; i < this.basamakSayisi; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'digit-input';
            input.maxLength = 1;
            input.min = 0;
            input.max = 9;
            inputArea.appendChild(input);
        }
        
        // Input referanslarını güncelle
        this.inputs = Array.from(document.querySelectorAll('.digit-input'));
        
        // Event listenerları yeniden ekle
        this.inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => this.rakamGirisi(e, index));
            input.addEventListener('keydown', (e) => this.tusKontrolu(e, index));
        });
    }

    puanHesapla() {
        const zorlukPuani = {
            'easy': 1,
            'medium': 2,
            'hard': 3
        }[this.zorlukSelect.value];

        const basamakPuani = this.basamakSayisi - 2; // 3 basamak: 1, 4 basamak: 2, 5 basamak: 3
        const kalanHakPuani = Math.max(0, this.maxTahmin - this.tahminler.length);
        const ipucuPuani = this.kalanIpucu;

        return (zorlukPuani * 100) + (basamakPuani * 50) + (kalanHakPuani * 20) + (ipucuPuani * 10);
    }

    istatistikleriGuncelle(kazandi) {
        this.toplamOyun++;
        if (kazandi) {
            this.kazanilanOyun++;
            this.toplamPuan += this.puanHesapla();
        }
        this.toplamDeneme += this.tahminler.length;

        // İstatistikleri göster
        const dogrulukOrani = this.toplamOyun > 0 ? 
            Math.round((this.kazanilanOyun / this.toplamOyun) * 100) : 0;
        const ortDeneme = this.toplamOyun > 0 ? 
            (this.toplamDeneme / this.toplamOyun).toFixed(1) : '0.0';

        document.getElementById('accuracy').textContent = dogrulukOrani + '%';
        document.getElementById('avg-attempts').textContent = ortDeneme;
        document.getElementById('total-score').textContent = this.toplamPuan;
        
        // İstatistik panelini göster
        this.gameStats.style.display = 'block';
    }

    istatistikleriSifirla() {
        this.toplamOyun = 0;
        this.kazanilanOyun = 0;
        this.toplamPuan = 0;
        this.toplamDeneme = 0;
        
        document.getElementById('accuracy').textContent = '0%';
        document.getElementById('avg-attempts').textContent = '0.0';
        document.getElementById('total-score').textContent = '0';
        this.currentScore.textContent = '0';
        this.gameStats.style.display = 'none';
    }
}

// Oyunu başlat
document.addEventListener('DOMContentLoaded', () => {
    new SayiTahminOyunu();
}); 