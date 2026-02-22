let pTimes = {};
let timeOffset = 0;
let modalTimer;
let statusView = 0; 
let wakeLock = null;

async function initApp() {
    await syncTime();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchMonthly(pos.coords.latitude, pos.coords.longitude, true),
            () => fetchMonthly()
        );
    } else {
        fetchMonthly();
    }
    requestWakeLock();
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

async function fetchMonthly(lat = null, lng = null, isGPS = false) {
    const now = getCorrectNow();
    const city = document.getElementById("city").value;
    
    // বাংলাদেশের নির্ভুল সময়ের জন্য সঠিক সিটি কোঅর্ডিনেট (University of Islamic Sciences, Karachi Method)
    const cityCoords = {
        "Dhaka": { lat: 23.8103, lng: 90.4125 },
        "Sylhet": { lat: 24.8949, lng: 91.8687 },
        "Chittagong": { lat: 22.3569, lng: 91.7832 },
        "Rajshahi": { lat: 24.3745, lng: 88.6042 },
        "Khulna": { lat: 22.8456, lng: 89.5403 }
    };

    let url;
    if (isGPS && lat && lng) {
        url = `https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&method=1&school=1&month=${now.getMonth()+1}&year=${now.getFullYear()}`;
    } else {
        const coords = cityCoords[city] || cityCoords["Dhaka"];
        url = `https://api.aladhan.com/v1/calendar?latitude=${coords.lat}&longitude=${coords.lng}&method=1&school=1&month=${now.getMonth()+1}&year=${now.getFullYear()}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        localStorage.setItem('monthly_cache', JSON.stringify(data.data));
        updateUI(data.data);
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
    names.forEach(n => document.getElementById(n).innerText = t12(pTimes[n]));

    document.getElementById("Sehri").innerText = calculateSehri(pTimes.Fajr);
    document.getElementById("Iftar").innerText = t12(pTimes.Maghrib);
    document.getElementById("hijriDate").innerText = `${todayData.date.hijri.day} ${todayData.date.hijri.month.en}, ${todayData.date.hijri.year} AH`;
    updateStatus();
}

function calculateSehri(fajr) {
    let [h, m] = fajr.split(' ')[0].split(':').map(Number);
    let d = new Date(); 
    d.setHours(h, m, 0); 
    d.setMinutes(d.getMinutes() - 5); // সেহরির ৫ মিনিট আগে সতর্কতামূলক সময়
    return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function t12(t) {
    let [h, m] = t.split(' ')[0].split(':').map(Number);
    return `${(h % 12 || 12).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function updateStatus() {
    if (!pTimes.Fajr) return;
    const now = getCorrectNow();
    const sch = [{ n: "ফজর", t: pTimes.Fajr }, { n: "যোহর", t: pTimes.Dhuhr }, { n: "আসর", t: pTimes.Asr }, { n: "মাগরিব", t: pTimes.Maghrib }, { n: "এশা", t: pTimes.Isha }];
    let nextP = null, nextPT = null;

    for (let p of sch) {
        let [h, m] = p.t.split(' ')[0].split(':');
        let d = new Date(now); d.setHours(h, m, 0);
        if (d > now) { nextP = p; nextPT = d; break; }
    }
    if (!nextP) {
        nextP = sch[0]; nextPT = new Date(now); nextPT.setDate(now.getDate() + 1);
        let [h, m] = nextP.t.split(' ')[0].split(':'); nextPT.setHours(h, m, 0);
    }

    let [sfH, sfM] = pTimes.Fajr.split(' ')[0].split(':');
    let sTime = new Date(now); sTime.setHours(sfH, sfM, 0); sTime.setMinutes(sTime.getMinutes() - 5);
    if (now > sTime) sTime.setDate(sTime.getDate() + 1);

    let [ifH, ifM] = pTimes.Maghrib.split(' ')[0].split(':');
    let iTime = new Date(now); iTime.setHours(ifH, ifM, 0);
    if (now > iTime) iTime.setDate(iTime.getDate() + 1);

    let label = "", target = null;
    if (statusView === 0) { label = `পরবর্তী নামাজ: ${nextP.n}`; target = nextPT; }
    else if (statusView === 1) { label = "সেহরির বাকি:"; target = sTime; }
    else { label = "ইফতারের বাকি:"; target = iTime; }

    const diff = Math.floor((target - now) / 60000);
    const h = Math.floor(diff / 60), m = diff % 60;
    document.getElementById("prayerStatus").innerText = label;
    document.getElementById("nextTime").innerText = `(বাকি: ${h > 0 ? h + 'ঘঃ ' : ''}${m}মিঃ)`;
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
        const sehri = calculateSehri(day.timings.Fajr);
        const iftar = t12(day.timings.Maghrib);
        row.innerHTML = `<span class="day-num">${i + 1}</span><span style="flex: 1; margin-left: 5px;">${day.date.readable.split(' ')[0]} ${day.date.readable.split(' ')[1]}</span><span style="color:var(--gold); margin-right: 8px;">সেহরি: ${sehri}</span><span style="color:var(--neon)">ইফতার: ${iftar}</span>`;
        container.appendChild(row);
        if (i + 1 === today) setTimeout(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
    });
    document.getElementById("monthlyModal").style.display = "block";
    clearTimeout(modalTimer);
    modalTimer = setTimeout(closeModal, 10000);
}

function closeModal() { document.getElementById("monthlyModal").style.display = "none"; }
function toggleStatusView() { statusView = (statusView + 1) % 3; updateStatus(); }
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

function loadData() { fetchMonthly(); }
async function requestWakeLock() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
window.onload = initApp;
