let pTimes = {};
let timeOffset = 0;
let modalTimer;
let wakeLock = null;

async function initApp() {
    await syncTime();
    loadData();
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

async function loadData() {
    const now = getCorrectNow();
    const city = document.getElementById("city").value;
    const method = 1; // IslamicFinder Method
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

    // সব নামাজের সময় ও সূর্যোদয়
    const names = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    names.forEach(n => {
        let cleanTime = pTimes[n].split(' ')[0];
        document.getElementById(n).innerText = format12Hour(cleanTime);
    });

    // সেহরি ও ইফতার (৫ মিনিট বিয়োগ ছাড়া)
    const fajarActual = pTimes.Fajr.split(' ')[0];
    const maghribActual = pTimes.Maghrib.split(' ')[0];
    document.getElementById("Sehri").innerText = format12Hour(fajarActual);
    document.getElementById("Iftar").innerText = format12Hour(maghribActual);
    
    document.getElementById("hijriDate").innerText = `${todayData.date.hijri.day} ${todayData.date.hijri.month.en}, ${todayData.date.hijri.year} AH`;
    
    updateStatus();
}

function format12Hour(timeStr) {
    let [h, m] = timeStr.split(':').map(Number);
    let ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function updateStatus() {
    if (!pTimes.Fajr) return;
    const now = getCorrectNow();
    
    // ১. পরবর্তী নামাজ লজিক
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

    // ২. সেহরি ও ইফতার টার্গেট
    let [sfH, sfM] = pTimes.Fajr.split(' ')[0].split(':');
    let sTarget = new Date(now); sTarget.setHours(sfH, sfM, 0);
    if (now > sTarget) sTarget.setDate(sTarget.getDate() + 1);

    let [ifH, ifM] = pTimes.Maghrib.split(' ')[0].split(':');
    let iTarget = new Date(now); iTarget.setHours(ifH, ifM, 0);
    if (now > iTarget) iTarget.setDate(iTarget.getDate() + 1);

    const getRemaining = (target) => {
        const diff = Math.floor((target - now) / 1000);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        return `${h}ঘঃ ${m}মিঃ ${s}সেঃ`;
    };

    // স্ট্যাটাস বক্সে সব একসাথে আপডেট
    document.getElementById("combinedStatus").innerHTML = `
        <div class="status-line"><span class="label gold">পরবর্তী ${nextP.n}:</span> <span class="val">${getRemaining(nextPT)}</span></div>
        <div class="status-line"><span class="label neon">সেহরি বাকি:</span> <span class="val">${getRemaining(sTarget)}</span></div>
        <div class="status-line"><span class="label rose">ইফতার বাকি:</span> <span class="val">${getRemaining(iTarget)}</span></div>
    `;
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

function loadData() { fetchMonthly(); } // backward compatibility
async function requestWakeLock() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
window.onload = initApp;
