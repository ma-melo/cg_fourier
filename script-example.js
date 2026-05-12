(function () {
    const canvas = document.getElementById('example');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width  = 700;
    canvas.height = 450;

    const STATE = { IDLE: 0, DRAWING: 1, ANIMATING: 2 };
    let state = STATE.IDLE;

    let rawPoints   = [];   // pontos capturados pelo mouse (amostrados)
    let fourierData = [];   // resultado da DFT
    let epicyclePath = [];  // rastro do último epiciclo
    let animTime    = 0;
    let animId      = null;

    // botões
    const btnClear = document.createElement('button');
    const btnRun   = document.createElement('button');

    [btnClear, btnRun].forEach(btn => {
        btn.style.cssText = `
            font-family: monospace; font-size: 13px; cursor: pointer;
            padding: 8px 20px; border-radius: 20px; margin: 6px 5px 0;
            border: 2px solid; transition: all .25s;
        `;
    });

    btnClear.textContent = 'Limpar';
    btnClear.style.borderColor = '#747e7d';
    btnClear.style.color       = '#747e7d';
    btnClear.style.background  = 'transparent';

    btnRun.textContent = '▶  Animar';
    btnRun.style.borderColor = '#ffb74d';
    btnRun.style.color       = '#ffb74d';
    btnRun.style.background  = 'transparent';
    btnRun.disabled = true;
    btnRun.style.opacity = '0.4';

    const hint = document.createElement('p');
    hint.style.cssText = 'font-family:monospace; font-size:.8rem; color:#747e7d; margin:4px 0 0;';
    hint.textContent   = 'Desenhe algo no canvas e clique em Animar.';

    // Insere controles logo após o canvas
    canvas.insertAdjacentElement('afterend', hint);
    hint.insertAdjacentElement('afterend', btnRun);
    hint.insertAdjacentElement('afterend', btnClear);

    // Hover nos botões 
    btnClear.addEventListener('mouseenter', () => { btnClear.style.background='#747e7d'; btnClear.style.color='#111'; });
    btnClear.addEventListener('mouseleave', () => { btnClear.style.background='transparent'; btnClear.style.color='#747e7d'; });
    btnRun.addEventListener('mouseenter',   () => { if (!btnRun.disabled){ btnRun.style.background='#ffb74d'; btnRun.style.color='#111'; }});
    btnRun.addEventListener('mouseleave',   () => { btnRun.style.background='transparent'; btnRun.style.color='#ffb74d'; });

    // Helpers
    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        if (e.touches) {
            return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
        }
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function clearAll() {
        if (animId) cancelAnimationFrame(animId);
        rawPoints    = [];
        fourierData  = [];
        epicyclePath = [];
        animTime     = 0;
        state = STATE.IDLE;
        btnRun.disabled = true;
        btnRun.style.opacity = '0.4';
        hint.textContent = 'Desenhe algo no canvas e clique em Animar.';
        drawIdle();
    }

    function drawIdle() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Grade sutil
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width;  x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
        for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
        // Instrução central se vazio
        if (rawPoints.length === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('✏  desenhe aqui', canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
        }
    }

    // DFT Complexa 
    // Trata cada ponto (x,y) como número complexo x + iy
    // Retorna array de {re, im, freq, amp, phase} ordenado por amplitude
    function dft(points) {
        const N = points.length;
        const result = [];
        for (let k = 0; k < N; k++) {
            let re = 0, im = 0;
            for (let n = 0; n < N; n++) {
                const phi = (2 * Math.PI * k * n) / N;
                re += points[n].x * Math.cos(phi) + points[n].y * Math.sin(phi);
                im += -points[n].x * Math.sin(phi) + points[n].y * Math.cos(phi);
            }
            re /= N; im /= N;
            result.push({
                freq:  k,
                amp:   Math.sqrt(re * re + im * im),
                phase: Math.atan2(im, re),
            });
        }
        // Ordena do círculo maior para o menor
        return result.sort((a, b) => b.amp - a.amp);
    }

    // Amostrador: reduz para N pontos igualmente espaçados 
    function resample(points, N) {
        if (points.length <= N) return points;
        const step = Math.floor(points.length / N);
        const out = [];
        for (let i = 0; i < points.length; i += step) out.push(points[i]);
        return out.slice(0, N);
    }

    // Centraliza pontos no canvas
    function centerPoints(points) {
        const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
        const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
        return points.map(p => ({ x: p.x - cx, y: p.y - cy }));
    }

    //  Loop de animação 
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const N   = fourierData.length;
        const dt  = (2 * Math.PI) / N;
        const cx0 = canvas.width  / 2;
        const cy0 = canvas.height / 2;

        // Epiciclos
        let x = cx0, y = cy0;

        for (let i = 0; i < N; i++) {
            const { freq, amp, phase } = fourierData[i];
            const prevX = x, prevY = y;

            x += amp * Math.cos(freq * animTime + phase);
            y += amp * Math.sin(freq * animTime + phase);

            // Círculo
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(79,195,247,0.18)';
            ctx.lineWidth = 1;
            ctx.arc(prevX, prevY, amp, 0, Math.PI * 2);
            ctx.stroke();

            // Braço
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(192,132,252,0.55)';
            ctx.lineWidth = 1.2;
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Registra ponto do último epiciclo
        epicyclePath.unshift({ x, y });
        if (epicyclePath.length > N) epicyclePath.pop();

        // Linha de conexão (ponta → início do rastro)
        if (epicyclePath.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.moveTo(x, y);
            ctx.lineTo(epicyclePath[0].x, epicyclePath[0].y);
            ctx.stroke();
        }

        // Rastro do desenho
        if (epicyclePath.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#ffb74d';
            ctx.lineWidth = 2.5;
            ctx.lineJoin  = 'round';
            ctx.lineCap   = 'round';
            epicyclePath.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else         ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        }

        // Ponto da ponta
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        animTime += dt;
        animId = requestAnimationFrame(animate);
    }

    // ── Eventos de desenho ─────────────────────────────────────────────────────
    let isDrawing  = false;
    let lastSample = 0;
    const SAMPLE_INTERVAL = 12; // ms — controla densidade dos pontos

    function startDraw(e) {
        if (state === STATE.ANIMATING) return;
        if (animId) cancelAnimationFrame(animId);
        state      = STATE.DRAWING;
        isDrawing  = true;
        rawPoints  = [];
        epicyclePath = [];
        btnRun.disabled = true;
        btnRun.style.opacity = '0.4';
        drawIdle();

        const pos = getPos(e);
        rawPoints.push(pos);
        lastSample = Date.now();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 2.5;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function moveDraw(e) {
        if (!isDrawing || state !== STATE.DRAWING) return;
        e.preventDefault();
        const pos = getPos(e);
        const now = Date.now();

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);

        // Amostra com throttle para não ter pontos demais
        if (now - lastSample > SAMPLE_INTERVAL) {
            rawPoints.push(pos);
            lastSample = now;
        }
    }

    function endDraw() {
        if (!isDrawing) return;
        isDrawing = false;

        if (rawPoints.length < 8) {
            hint.textContent = 'Desenho muito curto — tente novamente.';
            state = STATE.IDLE;
            return;
        }

        btnRun.disabled = false;
        btnRun.style.opacity = '1';
        hint.textContent = `${rawPoints.length} pontos capturados — clique em Animar!`;
        state = STATE.IDLE;
    }

    canvas.addEventListener('mousedown',  startDraw);
    canvas.addEventListener('mousemove',  moveDraw);
    canvas.addEventListener('mouseup',    endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
    canvas.addEventListener('touchmove',  e => { e.preventDefault(); moveDraw(e);  }, { passive: false });
    canvas.addEventListener('touchend',   endDraw);

    // ── Botões ─────────────────────────────────────────────────────────────────
    btnRun.addEventListener('click', () => {
        if (rawPoints.length < 8) return;

        // Prepara dados: resample → centraliza → DFT
        const sampled  = resample(rawPoints, 256);
        const centered = centerPoints(sampled);
        fourierData    = dft(centered);
        epicyclePath   = [];
        animTime       = 0;
        state          = STATE.ANIMATING;
        hint.textContent = 'Animando com ' + fourierData.length + ' epiciclos.';

        if (animId) cancelAnimationFrame(animId);
        animate();
    });

    btnClear.addEventListener('click', clearAll);

    // ── Início ─────────────────────────────────────────────────────────────────
    drawIdle();
})();