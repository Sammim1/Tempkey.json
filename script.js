let pTimes = {};
let timeOffset = 0;
let modalTimer;
let statusView = 0; 
let wakeLock = null;

async function initApp() {
    await syncTime();
    loadData();
    requestWakeLock();
    // স্ট্যাটাস অটোমেটিক পরিবর্তন হওয়ার জন্য (ঐচ্ছিক, চাইলে ক্লিক করেও বদলাতে পারবেন)
    setInterval(() => {
        statusView = (statusView + 1) % 3;
    }, 10000); // ১০ সেকেন্ড পর পর ভিউ বদলাবে
}

async function syncTime() {
    try {
        const start = Date.now();
        const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Dhaka');
        const data = await res.json();
        const sTime = new Date(data.datetime).getTime();
        timeOffset = (sTime + (Date.now() - start) / 2) - Date.now();
    } catch (e) { timeOffset = 0; }
}

function getCorrectNow() { return new Date(Date.now() + timeOffset); }

async function loadData() {
    const now = getCorrectNow();
    const city = document.getElementById("city").value;
    
    // IslamicFinder Standard (Method 1)
    const method = 1; 
    const url = `https://api.aladhan.com/v1/calendarByCity?city=${city}&country=Bangladesh&method=${method}&school=1&month=${now.getMonth()+1}&year=${now.getFullYear()}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if(data.code === 200) {
            localStorage.setItem('monthly_cache', JSON.stringify(data.data));
            updateUI(data.data);
        }
    } catch (e) {
        const cached = JSON.parse(localStorage.getItem('monthly_cache'));
        if (cached) updateUI(cached);
    }
}

function updateUI(monthlyData) {
    const today = getCorrectNow().getDate();
    const todayData = monthlyData[today - 1];
    pTimes = todayData.timings;

    const names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    names.forEach(n => {
        let cleanTime = pTimes[n].split(' ')[0];
        document.getElementById(n).innerText = format12Hour(cleanTime);
    });

    // ৫ মিনিট বিয়োগ বাদ দেওয়া হয়েছে - এখন সরাসরি ফজরের টাইমই সেহরি শেষ
    let fajarTime = pTimes.Fajr.split(' ')[0];
    document.getElementById("Sehri").innerText = format12Hour(fajarTime);
    document.getElementById("Iftar").innerText = format12Hour(pTimes.Maghrib.split(' ')[0]);
    
    document.getElementById("hijriDate").innerText = `${todayData.date.hijri.day} ${todayData.date.hijri.month.en}, ${todayData.date.hijri.year} AH`;
    
    updateStatus();
}

function format12Hour(timeStr) {
    let [h, m] = timeStr.split(':').map(Number);
    let ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// সেহরি ক্যালকুলেশন এখন সরাসরি ফজরের সময় রিটার্ন করবে
function calculateSehri(fajrStr) {
    return format12Hour(fajrStr);
}

function toggleStatusView() { 
    statusView = (statusView + 1) % 3; 
    updateStatus(); 
}

function updateStatus() {
    if (!pTimes.Fajr) return;
    const now = getCorrectNow();
    
    const sch = [
        { n: "ফজর", t: pTimes.Fajr.split(' ')[0] },
        { n: "যোহর", t: pTimes.Dhuhr.split(' ')[0] },
        { n: "আসর", t: pTimes.Asr.split(' ')[0] },
        { n: "মাগরিব", t: pTimes.Maghrib.split(' ')[0] },
        { n: "এশা", t: pTimes.Isha.split(' ')[0] }
    ];

    let nextP = null, nextPT = null;
    for (let p of sch) {
        let [h, m] = p.t.split(':');
        let d = new Date(now); d.setHours(h, m, 0);
        if (d > now) { nextP = p; nextPT = d; break; }
    }
    if (!nextP) {
        nextP = sch[0]; nextPT = new Date(now); nextPT.setDate(now.getDate() + 1);
        let [h, m] = nextP.t.split(':'); nextPT.setHours(h, m, 0);
    }

    let target = nextPT;
    let label = `পরবর্তী নামাজ: ${nextP.n}`;

    if (statusView === 1) { 
        label = "সেহরির বাকি:"; 
        let [sfH, sfM] = pTimes.Fajr.split(' ')[0].split(':');
        target = new Date(now); target.setHours(sfH, sfM, 0);
        if (now > target) target.setDate(target.getDate() + 1);
    } else if (statusView === 2) { 
        label = "ইফতারের বাকি:"; 
        let [ifH, ifM] = pTimes.Maghrib.split(' ')[0].split(':');
        target = new Date(now); target.setHours(ifH, ifM, 0);
        if (now > target) target.setDate(target.getDate() + 1);
    }

    // সেকেন্ডসহ সুক্ষ্ম হিসাব
    const diffMs = target - now;
    const totalSeconds = Math.floor(diffMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    document.getElementById("prayerStatus").innerText = label;
    document.getElementById("nextTime").innerText = ` (${h}ঘঃ ${m}মিঃ ${s}সেঃ)`;
}

function showMonthlySchedule() {
    const data = JSON.parse(localStorage.getItem('monthly_cache'));
    if (!data) return;
    const container = document.getElementById("monthlyList");
    container.innerHTML = "";
    const today = getCorrectNow().getDate();
    data.forEach((day, i) => {
        const row = document.createElement("div");
        row.className = "list-item" + (i + 1 === today ? " today-highlight" : "");
        const sehri = format12Hour(day.timings.Fajr.split(' ')[0]);
        const iftar = format12Hour(day.timings.Maghrib.split(' ')[0]);
        row.innerHTML = `<span class="day-num">${i + 1}</span><span style="flex: 1; margin-left: 5px;">${day.date.readable.split(' ')[0]} ${day.date.readable.split(' ')[1]}</span><span style="color:var(--gold); margin-right: 8px;">সেহরি: ${sehri}</span><span style="color:var(--neon)">ইফতার: ${iftar}</span>`;
        container.appendChild(row);
        if (i + 1 === today) setTimeout(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
    });
    document.getElementById("monthlyModal").style.display = "block";
    clearTimeout(modalTimer);
    modalTimer = setTimeout(closeModal, 10000);
}

function closeModal() { document.getElementById("monthlyModal").style.display = "none"; }
function toggleRakat(id) {
    document.querySelectorAll('.rakat-info').forEach(el => el.id !== id && el.classList.remove('show-rakat'));
    document.getElementById(id).classList.toggle('show-rakat');
}

setInterval(() => {
    const now = getCorrectNow();
    document.getElementById("clock").innerText = now.toLocaleTimeString("bn-BD");
    document.getElementById("today").innerText = now.toLocaleDateString("bn-BD", { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    if (pTimes.Fajr) updateStatus();
}, 1000);

async function requestWakeLock() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
window.onload = initApp;
