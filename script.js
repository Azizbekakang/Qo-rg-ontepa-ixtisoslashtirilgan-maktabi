// ===== FACE RECOGNITION VARIABLES =====
let video = null;
let canvas = null;
let referenceImage = null;
let referenceDescriptors = null;
let stream = null;
let modelsLoaded = false;
let modelsLoading = false;

// ===== FACE RECOGNITION WITH face-api.js =====
// face-api.js uses TensorFlow.js for face detection and recognition
// We'll use the built-in models from face-api.js which are optimized

// ===== LOAD MODELS =====
async function loadModels() {
    if (modelsLoading) return;
    modelsLoading = true;
    
    try {
        // Show loading state
        const statusElement = document.getElementById('models-status');
        const progressElement = document.getElementById('models-progress');
        
        if (statusElement) {
            statusElement.classList.remove('hidden');
            statusElement.textContent = 'face-api.js models va TensorFlow.js yuklanmoqda...';
        }
        if (progressElement) {
            progressElement.classList.remove('hidden');
            progressElement.style.width = '0%';
        }
        
        // Wait for TensorFlow.js to be ready
        await tf.ready();
        console.log('TensorFlow.js ready');
        
        // Load models from jsdelivr CDN (most reliable for face-api.js)
        const modelsPath = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
        
        // Load face detection model
        if (progressElement) progressElement.style.width = '33%';
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
        console.log('tinyFaceDetector loaded');
        
        // Load face landmark model (for face alignment)
        if (progressElement) progressElement.style.width = '66%';
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
        console.log('faceLandmark68Net loaded');
        
        // Load face recognition model (the main one for face matching)
        if (progressElement) progressElement.style.width = '100%';
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath);
        console.log('faceRecognitionNet loaded');
        
        modelsLoaded = true;
        console.log('✓ All face-api.js models loaded successfully');
        
        if (statusElement) {
            statusElement.textContent = '✓ Models yuklandi! Endi yuz solishtirish mumkin.';
            setTimeout(() => {
                statusElement.classList.add('hidden');
                if (progressElement) progressElement.classList.add('hidden');
            }, 1500);
        }
    } catch (error) {
        console.error('Error loading face-api.js models:', error);
        const statusElement = document.getElementById('models-status');
        if (statusElement) {
            statusElement.textContent = '✗ Models yuklanmadi! Internetni tekshiring. ' + error.message;
        }
    } finally {
        modelsLoading = false;
    }
}

// ===== LOAD MODELS IMMEDIATELY =====
// Start loading models right away when script loads
loadModels();

// ===== CAMERA FUNCTIONS =====
async function startCamera() {
    if (!modelsLoaded) {
        showResult('Kuting!', 'Models hali yuklanmagan. Iltimos, 2-3 soniya kutib turing...', 'info');
        return;
    }
    
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, 
            audio: false 
        });
        video.srcObject = stream;
        document.getElementById('start-camera').classList.add('hidden');
        document.getElementById('stop-camera').classList.remove('hidden');
        document.getElementById('capture-face').classList.remove('hidden');
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
    
    referenceUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check if models are loaded
        if (!modelsLoaded) {
            showResult('Kuting!', 'Avval models yuklanishi kerak. Iltimos, 2-3 soniya kutib turing...', 'info');
            referenceUpload.value = ''; // Clear the input
            return;
        }
        
        try {
            referenceImage = await faceapi.bufferToImage(file);
            referencePreview.src = URL.createObjectURL(file);
            referencePreview.classList.remove('hidden');
            
            // Enable verification button
            startVerificationBtn.disabled = false;
            startVerificationBtn.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
            
            // Extract face descriptors from reference image
            const detections = await faceapi.detectAllFaces(referenceImage, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();
            
            if (detections.length > 0) {
                referenceDescriptors = detections.map(d => d.descriptor);
                showResult('Tayyor!', 'Reference yuz topildi. Endi kamerani yoqing.', 'success');
            } else {
                referenceDescriptors = null;
                showResult('Xatolik!', 'Yuz topilmadi. Boshqa rasm tanlang.', 'error');
                referencePreview.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error processing reference image:', error);
            showResult('Xatolik!', 'Rasmni qabul qilishda xatolik yuz berdi.', 'error');
            referenceUpload.value = '';
        }
    });
    
    // Start verification button
    startVerificationBtn.addEventListener('click', async () => {
        if (!modelsLoaded) {
            showResult('Kuting!', 'Models hali yuklanmagan. Iltimos, 2-3 soniya kutib turing...', 'info');
            return;
        }
        
        if (!referenceDescriptors) {
            showResult('Xatolik!', 'Avval reference rasm yuklang!', 'error');
            return;
        }
        
        // Start camera automatically
        await startCamera();
        showResult('Kamera yoqildi', 'Yuzingizni kameraga qarating va "Rasm Olish" tugmasini bosing.', 'info');
    });
    
    // Camera buttons
    document.getElementById('start-camera').addEventListener('click', async () => {
        if (!modelsLoaded) {
            showResult('Kuting!', 'Models hali yuklanmagan. Iltimos, 2-3 soniya kutib turing...', 'info');
            return;
        }
        await startCamera();
    });
    document.getElementById('stop-camera').addEventListener('click', stopCamera);
    document.getElementById('capture-face').addEventListener('click', async () => {
        if (!modelsLoaded) {
            showResult('Kuting!', 'Models hali yuklanmagan. Iltimos, 2-3 soniya kutib turing...', 'info');
            return;
        }
        await captureAndCompare();
    });
});

// ===== CAPTURE AND COMPARE =====
async function captureAndCompare() {
    if (!video || !canvas) {
        showResult('Xatolik!', 'Kamera yoqilmagan!', 'error');
        return;
    }
    
    if (!referenceDescriptors) {
        showResult('Xatolik!', 'Avval reference rasm yuklang!', 'error');
        return;
    }
    
    try {
        // Show processing state
        showResult('Kutilmoqda...', 'Yuzni aniqlash va solishtirish jarayonida...', 'info');
        
        // Capture frame from video
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Detect faces in captured image
        const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();
        
        if (detections.length === 0) {
            showResult('Yuz topilmadi!', 'Kamerada yuz yoq. Iltimos, yuzingizni kameraga qarating.', 'error');
            return;
        }
        
        // Compare with reference
        const faceMatcher = new faceapi.FaceMatcher(referenceDescriptors, 0.6);
        const results = detections.map(d => faceMatcher.findBestMatch(d.descriptor));
        
        // Display results
        const bestMatch = results[0];
        const confidence = bestMatch.distance;
        const isMatch = confidence <= 0.6; // Threshold: lower is better
        
        let resultText, resultDesc, resultType;
        if (isMatch) {
            resultText = 'Muvvaffaqiyatli!';
            resultDesc = `Yuz mos keladi! Aniqlik: ${Math.round((1 - confidence) * 100)}%`;
            resultType = 'success';
        } else {
            resultText = 'Mos kelmadi!';
            resultDesc = `Yuz mos kelmadi. Aniqlik: ${Math.round((1 - confidence) * 100)}%`;
            resultType = 'error';
        }
        
        showResult(resultText, resultDesc, resultType);
    } catch (error) {
        console.error('Error in captureAndCompare:', error);
        showResult('Xatolik!', 'Yuzni aniqlashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.', 'error');
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
    resultDiv.classList.remove('bg-green-50', 'bg-red-50', 'bg-blue-50', 'text-green-700', 'text-red-700', 'text-blue-700', 'border-green-200', 'border-red-200', 'border-blue-200');
    
    if (type === 'success') {
        resultDiv.classList.add('bg-green-50', 'text-green-700', 'border-green-200');
    } else if (type === 'error') {
        resultDiv.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
    } else {
        resultDiv.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
    }
}

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
