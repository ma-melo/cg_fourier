(function () {
    const canvas = document.getElementById('example');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width  = 700;
    canvas.height = 480;

    // Estado
    const STATE = { IDLE: 0, DRAWING: 1, ANIMATING: 2 };
    let state        = STATE.IDLE;
    let rawPoints    = [];
    let fourierData  = [];
    let epicyclePath = [];
    let animTime     = 0;
    let animId       = null;
    let activeTab    = 'draw';

    // Forma pronta
    const PRESETS = {
        'Estrela': () => {
            const pts = [];
            const spikes = 5, outer = 90, inner = 38;
            for (let i = 0; i < spikes * 2; i++) {
                const r   = i % 2 === 0 ? outer : inner;
                const ang = (Math.PI / spikes) * i - Math.PI / 2;
                pts.push({ x: r * Math.cos(ang), y: r * Math.sin(ang) });
            }
            return interpolate(pts, 256);
        },
        'Coração': () => {
            const pts = [];
            for (let i = 0; i < 256; i++) {
                const t = (2 * Math.PI * i) / 256;
                pts.push({
                    x:  80 * 16 * Math.pow(Math.sin(t), 3) / 16,
                    y: -80 * (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) / 16
                });
            }
            return pts;
        },
        'Flor': () => {
            const pts = [];
            for (let i = 0; i < 256; i++) {
                const t = (2 * Math.PI * i) / 256;
                const r = 75 * Math.abs(Math.cos(3 * t));
                pts.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
            }
            return pts;
        },
    };

    // Helpers Matemáticos
    function interpolate(points, N) {
        const closed = [...points, points[0]];
        const lengths = [];
        let total = 0;
        for (let i = 0; i < closed.length - 1; i++) {
            const d = Math.hypot(closed[i+1].x - closed[i].x, closed[i+1].y - closed[i].y);
            lengths.push(d);
            total += d;
        }
        const step = total / N;
        const out  = [];
        let seg = 0, walked = 0;
        for (let k = 0; k < N; k++) {
            const target = k * step;
            while (seg < lengths.length - 1 && walked + lengths[seg] < target) {
                walked += lengths[seg++];
            }
            const t = lengths[seg] > 0 ? (target - walked) / lengths[seg] : 0;
            out.push({
                x: closed[seg].x + t * (closed[seg+1].x - closed[seg].x),
                y: closed[seg].y + t * (closed[seg+1].y - closed[seg].y),
            });
        }
        return out;
    }

    function resample(points, N) {
        if (points.length <= N) return points;
        return interpolate(points, N);
    }

    function centerPoints(points) {
        const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
        const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
        return points.map(p => ({ x: p.x - cx, y: p.y - cy }));
    }

    function dft(points) {
        const N = points.length;
        return Array.from({ length: N }, (_, k) => {
            let re = 0, im = 0;
            for (let n = 0; n < N; n++) {
                const phi = (2 * Math.PI * k * n) / N;
                re +=  points[n].x * Math.cos(phi) + points[n].y * Math.sin(phi);
                im += -points[n].x * Math.sin(phi) + points[n].y * Math.cos(phi);
            }
            re /= N; im /= N;
            return { freq: k, amp: Math.sqrt(re*re + im*im), phase: Math.atan2(im, re) };
        }).sort((a, b) => b.amp - a.amp);
    }

    function runAnimation(points) {
        if (animId) cancelAnimationFrame(animId);
        const sampled = resample(centerPoints(points), 256);
        fourierData   = dft(sampled);
        epicyclePath  = [];
        animTime      = 0;
        state         = STATE.ANIMATING;
        animate();
    }

    // Animação
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();

        const N  = fourierData.length;
        const dt = (2 * Math.PI) / N;
        let x = canvas.width / 2, y = canvas.height / 2;

        for (let i = 0; i < N; i++) {
            const { freq, amp, phase } = fourierData[i];
            const px = x, py = y;
            x += amp * Math.cos(freq * animTime + phase);
            y += amp * Math.sin(freq * animTime + phase);

            if (amp > 0.5) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(79,195,247,0.85)';
                ctx.lineWidth = 1;
                ctx.arc(px, py, amp, 0, Math.PI * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.strokeStyle = 'rgba(192,132,252,0.5)';
                ctx.lineWidth = 1.2;
                ctx.moveTo(px, py);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }

        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "14px monospace";
        ctx.fillText(`Epiciclos: ${N}`, 20, 30);

        epicyclePath.unshift({ x, y });
        if (epicyclePath.length > N) epicyclePath.pop();

        if (epicyclePath.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#ffb74d';
            ctx.lineWidth = 2.5;
            ctx.lineJoin = ctx.lineCap = 'round';
            epicyclePath.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        animTime += dt;
        animId = requestAnimationFrame(animate);
    }

    // Canvas Helpers
    function drawGrid() {
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < canvas.width;  gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke(); }
        for (let gy = 0; gy < canvas.height; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy);   ctx.stroke(); }
    }

    function drawIdle(msg) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        if (msg) {
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
        }
    }

    // ui Helpers
    function makeBtn(label, color) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = `
            font-family:monospace; font-size:12px; cursor:pointer;
            padding:7px 16px; border-radius:20px;
            border:2px solid ${color}; color:${color};
            background:transparent; transition:all .2s;
        `;
        btn.addEventListener('mouseenter', () => { if (!btn.disabled) { btn.style.background = color; btn.style.color = '#111'; } });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; btn.style.color = color; });
        return btn;
    }

    function makeHint(text) {
        const p = document.createElement('p');
        p.textContent = text;
        p.style.cssText = 'font-size:.75rem; color:#747e7d; margin:4px 0 0; width:100%; text-align:center;';
        return p;
    }

    // ui - montagem
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `display:flex; flex-direction:column; align-items:center; width:${canvas.width}px; font-family:monospace;`;
    canvas.parentNode.insertBefore(wrapper, canvas);
    wrapper.appendChild(canvas);

    // Abas
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex; width:100%;';

    const tabDefs = [
        { id: 'draw',    label: 'Desenhar com Mouse' },
        { id: 'presets', label: 'Formas Prontas' },
    ];
    const tabEls = {};
    tabDefs.forEach(({ id, label }) => {
        const btn = document.createElement('button');
        btn.textContent  = label;
        btn.dataset.tab  = id;
        btn.style.cssText = `
            flex:1; padding:10px; font-family:monospace; font-size:13px;
            background:rgba(255,255,255,0.04); color:#747e7d;
            border:1px solid #333; border-bottom:none; cursor:pointer; transition:all .2s;
        `;
        btn.addEventListener('click', () => switchTab(id));
        tabBar.appendChild(btn);
        tabEls[id] = btn;
    });
    wrapper.insertBefore(tabBar, canvas);

    // Painéis
    function makePanel() {
        const d = document.createElement('div');
        d.style.cssText = `
            width:100%; padding:10px 0 8px; display:none;
            background:rgba(255,255,255,0.03); border:1px solid #333; border-bottom:none;
            align-items:center; justify-content:center; gap:10px; flex-wrap:wrap;
        `;
        wrapper.insertBefore(d, canvas);
        return d;
    }

    const panelDraw    = makePanel();
    const panelPresets = makePanel();

    // Painel Desenhar
    const btnAnimar = makeBtn('Animar', '#4fc3f7');
    const btnLimpar = makeBtn('Limpar', '#747e7d');
    const hintDraw  = makeHint('Desenhe no canvas e clique em Animar.');
    btnAnimar.disabled = true; btnAnimar.style.opacity = '0.4';
    panelDraw.append(btnAnimar, btnLimpar, hintDraw);

    // Painel Formas Prontas
    Object.entries(PRESETS).forEach(([name, fn]) => {
        const btn = makeBtn(name, '#c084fc');
        btn.addEventListener('click', () => {
            if (animId) cancelAnimationFrame(animId);
            runAnimation(fn());
        });
        panelPresets.appendChild(btn);
    });

    canvas.style.cssText += 'border:1px solid #333; border-top:none;';

    // Lógica de troca de abas
    function switchTab(id) {
        activeTab = id;
        Object.entries(tabEls).forEach(([tid, el]) => {
            const on = tid === id;
            el.style.background  = on ? '#111' : 'rgba(255,255,255,0.04)';
            el.style.color       = on ? '#4fc3f7' : '#747e7d';
            el.style.borderColor = on ? '#4fc3f7' : '#333';
        });
        panelDraw.style.display    = id === 'draw'    ? 'flex' : 'none';
        panelPresets.style.display = id === 'presets' ? 'flex' : 'none';

        isDrawing = false;
        if (animId) cancelAnimationFrame(animId);
        state = STATE.IDLE; rawPoints = [];
        drawIdle(id === 'draw' ? 'desenhe aqui' : 'escolha uma forma');
    }

    // Eventos — Desenho
    let isDrawing  = false;
    let lastSample = 0;

    function getPos(e) {
        const r   = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - r.left, y: src.clientY - r.top };
    }

    canvas.addEventListener('mousedown', e => {
        if (activeTab !== 'draw' || state === STATE.ANIMATING) return;
        if (animId) cancelAnimationFrame(animId);
        isDrawing = true; rawPoints = []; state = STATE.DRAWING;
        btnAnimar.disabled = true; btnAnimar.style.opacity = '0.4';
        drawIdle();
        const pos = getPos(e);
        rawPoints.push(pos); lastSample = Date.now();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
        ctx.lineCap = ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener('mousemove', e => {
        if (!isDrawing || activeTab !== 'draw') return;
        const pos = getPos(e), now = Date.now();
        ctx.lineTo(pos.x, pos.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
        if (now - lastSample > 12) { rawPoints.push(pos); lastSample = now; }
    });

    const stopDraw = () => {
        if (!isDrawing) return;
        isDrawing = false;
        if (rawPoints.length >= 8) {
            btnAnimar.disabled = false; btnAnimar.style.opacity = '1';
            hintDraw.textContent = `${rawPoints.length} pontos — clique em Animar!`;
        } else {
            hintDraw.textContent = 'Desenho muito curto — tente novamente.';
            state = STATE.IDLE;
        }
    };

    canvas.addEventListener('mouseup',    stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })); }, { passive: false });
    canvas.addEventListener('touchmove',  e => { e.preventDefault(); canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })); }, { passive: false });
    canvas.addEventListener('touchend',   stopDraw);

    // Eventos - Botões
    btnAnimar.addEventListener('click', () => {
        if (rawPoints.length < 8) return;
        hintDraw.textContent = 'Animando com epiciclos...';
        runAnimation(rawPoints.map(p => ({ x: p.x - canvas.width / 2, y: p.y - canvas.height / 2 })));
    });

    btnLimpar.addEventListener('click', () => {
        if (animId) cancelAnimationFrame(animId);
        rawPoints = []; state = STATE.IDLE;
        btnAnimar.disabled = true; btnAnimar.style.opacity = '0.4';
        hintDraw.textContent = 'Desenhe no canvas e clique em Animar.';
        drawIdle('desenhe aqui');
    });

    // Init
    switchTab('draw');
})();