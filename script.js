// ===== SIMPLE PIXEL COMPARISON SYSTEM =====
// Modelsiz, faqat pixel-pixel solishtirish

let video = null;
let canvas = null;
let referenceImage = null;
let stream = null;

// ===== SIMPLE PIXEL COMPARISON =====
async function compareImagesByPixels(img1, img2, threshold = 0.85) {
    return new Promise((resolve) => {
        const c1 = document.createElement('canvas');
        const c2 = document.createElement('canvas');
        const ctx1 = c1.getContext('2d');
        const ctx2 = c2.getContext('2d');
        
        // Set fixed size for comparison (150x150 for speed)
        const width = 150;
        const height = 150;
        
        c1.width = width;
        c1.height = height;
        c2.width = width;
        c2.height = height;
        
        // Draw images
        ctx1.drawImage(img1, 0, 0, width, height);
        ctx2.drawImage(img2, 0, 0, width, height);
        
        const data1 = ctx1.getImageData(0, 0, width, height).data;
        const data2 = ctx2.getImageData(0, 0, width, height).data;
        
        let diff = 0;
        for (let i = 0; i < data1.length; i += 4) {
            diff += Math.abs(data1[i] - data2[i]);
            diff += Math.abs(data1[i+1] - data2[i+1]);
            diff += Math.abs(data1[i+2] - data2[i+2]);
        }
        
        const maxDiff = 255 * 3 * (data1.length / 4);
        const similarity = 1 - (diff / maxDiff);
        
        resolve({ similarity, isMatch: similarity >= threshold });
    });
}

// ===== CAMERA FUNCTIONS =====
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: false 
        });
        video.srcObject = stream;
        document.getElementById('start-camera').classList.add('hidden');
        document.getElementById('stop-camera').classList.remove('hidden');
        document.getElementById('capture-face').classList.remove('hidden');
        showResult('Kamera yoqildi', 'Yuzingizni kameraga qarating va "Rasm Olish" tugmasini bosing.', 'info');
    } catch (error) {
        console.error('Camera error:', error);
        showResult('Xatolik!', 'Kamera ishga tushirilmadi. Ruxsat berilganligini tekshiring.', 'error');
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        stream = null;
    }
    document.getElementById('start-camera').classList.remove('hidden');
    document.getElementById('stop-camera').classList.add('hidden');
    document.getElementById('capture-face').classList.add('hidden');
}

// ===== CAPTURE AND COMPARE =====
async function captureAndCompare() {
    if (!video || !canvas) {
        showResult('Xatolik!', 'Kamera yoqilmagan!', 'error');
        return;
    }
    
    if (!referenceImage) {
        showResult('Xatolik!', 'Avval reference rasm yuklang!', 'error');
        return;
    }
    
    try {
        showResult('Kutilmoqda...', 'Rasm olinmoqda va solishtirilmoqda...', 'info');
        
        // Capture frame from video
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Compare images
        const comparison = await compareImagesByPixels(referenceImage, canvas);
        
        let resultText, resultDesc, resultType;
        if (comparison.isMatch) {
            resultText = 'Muvvaffaqiyatli!';
            resultDesc = `Rasmlar mos keladi! O'xshashlik: ${Math.round(comparison.similarity * 100)}%`;
            resultType = 'success';
        } else {
            resultText = 'Mos kelmadi!';
            resultDesc = `Rasmlar mos kelmadi. O'xshashlik: ${Math.round(comparison.similarity * 100)}%`;
            resultType = 'error';
        }
        
        showResult(resultText, resultDesc, resultType);
    } catch (error) {
        console.error('Error in captureAndCompare:', error);
        showResult('Xatolik!', 'Rasmni solishtirishda xatolik yuz berdi.', 'error');
    }
}

// ===== SHOW RESULT =====
function showResult(text, desc, type) {
    const resultDiv = document.getElementById('verification-result');
    const resultText = document.getElementById('result-text');
    const resultConfidence = document.getElementById('result-confidence');
    
    resultText.textContent = text;
    resultConfidence.textContent = desc;
    resultDiv.classList.remove('hidden');
    
    // Set color based on type
    resultDiv.classList.remove('bg-green-50', 'bg-red-50', 'bg-blue-50', 
                               'text-green-700', 'text-red-700', 'text-blue-700',
                               'border-green-200', 'border-red-200', 'border-blue-200');
    
    if (type === 'success') {
        resultDiv.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
    } else if (type === 'error') {
        resultDiv.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
    } else {
        resultDiv.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
    }
}

// ===== IMAGE UPLOAD & PREVIEW =====
document.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    
    // Initialize existing functionality
    initData();
    renderTeachers();
    renderNews();

    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Reference image upload
    const referenceUpload = document.getElementById('reference-upload');
    const referencePreview = document.getElementById('reference-preview');
    const startVerificationBtn = document.getElementById('start-verification');
    
    referenceUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        referenceImage = new Image();
        referenceImage.src = URL.createObjectURL(file);
        referencePreview.src = URL.createObjectURL(file);
        referencePreview.classList.remove('hidden');
        
        // Enable verification button
        startVerificationBtn.disabled = false;
        startVerificationBtn.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
        
        showResult('Tayyor!', 'Reference rasm yuklandi. Endi kamerani yoqing.', 'success');
    });
    
    // Start verification button
    startVerificationBtn.addEventListener('click', startCamera);
    
    // Camera buttons
    document.getElementById('start-camera').addEventListener('click', startCamera);
    document.getElementById('stop-camera').addEventListener('click', stopCamera);
    document.getElementById('capture-face').addEventListener('click', captureAndCompare);
});

// ===== EXISTING FUNCTIONS (Keep for compatibility) =====

// Boshlang'ich Test Ma'lumotlari
const defaultTeachers = [
    {
        name: "Sardor Rahimov",
        subject: "Matematika va Fizika",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop"
    },
    {
        name: "Malika Axmedova",
        subject: "Ingliz tili (IELTS 8.0)",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500&auto=format&fit=crop"
    },
    {
        name: "Javohir Karimov",
        subject: "Informatika va IT",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500&auto=format&fit=crop"
    }
];

const defaultNews = [
    {
        title: "Maktabimizda Fan Olimpiadasi Boshlandi",
        date: "12 Sentyabr, 2026",
        desc: "O'quvchilar o'rtasida matematika va fizika fanlaridan saralash bosqichi bo'lib o'tdi.",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop"
    },
    {
        title: "Yangi Kompyuter Sinfining Ochilish Marosimi",
        date: "05 Sentyabr, 2026",
        desc: "Maktabimizda zamonaviy AKT xonasi va tezkor internet tarmog'i ishga tushirildi.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop"
    }
];

// LocalStorage tekshiruvi
function initData() {
    if (!localStorage.getItem('teachers')) {
        localStorage.setItem('teachers', JSON.stringify(defaultTeachers));
    }
    if (!localStorage.getItem('news')) {
        localStorage.setItem('news', JSON.stringify(defaultNews));
    }
}

// O'qituvchilarni chiqarish
function renderTeachers() {
    const grid = document.getElementById('teachers-grid');
    if (!grid) return;
    
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
    grid.innerHTML = teachers.map(t => `
        <div class="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition">
            <img src="${t.image}" alt="${t.name}" class="w-full h-56 object-cover">
            <div class="p-6">
                <h3 class="text-xl font-bold text-slate-900">${t.name}</h3>
                <p class="text-blue-600 font-medium text-sm mt-1">${t.subject}</p>
            </div>
        </div>
    `).join('');
}

// Yangiliklarni chiqarish
function renderNews() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    const news = JSON.parse(localStorage.getItem('news')) || [];
    grid.innerHTML = news.map(n => `
        <div class="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition">
            <img src="${n.image}" alt="${n.title}" class="w-full h-48 object-cover">
            <div class="p-6">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${n.date}</span>
                <h3 class="text-lg font-bold text-slate-900 mt-2 mb-2">${n.title}</h3>
                <p class="text-slate-600 text-sm leading-relaxed">${n.desc}</p>
            </div>
        </div>
    `).join('');
}
