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

// Mobil Menyuni Boshqarish
document.addEventListener('DOMContentLoaded', () => {
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
});
