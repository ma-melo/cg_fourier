(function() {
    // Pontos base da estrela
    const baseStarPoints = [
        {x: 0, y: -60}, {x: 18, y: -20}, {x: 60, y: -15},
        {x: 28, y: 15}, {x: 35, y: 60}, {x: 0, y: 35},
        {x: -35, y: 60}, {x: -28, y: 15}, {x: -60, y: -15},
        {x: -18, y: -20}, {x: 0, y: -60}
    ];

    // ligando os pontos para ter mais dados
    function interpolatePoints(points, samplesPerEdge) {
        let interpolated = [];
        for (let i = 0; i < points.length - 1; i++) {
            let p1 = points[i];
            let p2 = points[i + 1];
            for (let j = 0; j < samplesPerEdge; j++) {
                let t = j / samplesPerEdge;
                interpolated.push({
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t
                });
            }
        }
        return interpolated;
    }

    // criamos 200 pontos a partir dos 10 originais
    const starPoints = interpolatePoints(baseStarPoints, 20);

    function dft(points) {
        const X = [];
        const N = points.length;
        for (let k = 0; k < N; k++) {
            let re = 0; let im = 0;
            for (let n = 0; n < N; n++) {
                const phi = (2 * Math.PI * k * n) / N;
                re += points[n].x * Math.cos(phi) + points[n].y * Math.sin(phi);
                im += -points[n].x * Math.sin(phi) + points[n].y * Math.cos(phi);
            }
            re /= N; im /= N;
            X[k] = { freq: k, amp: Math.sqrt(re*re + im*im), phase: Math.atan2(im, re) };
        }
        return X;
    }

    // Calculamos 200 epíciclos
    const fourierStar = dft(starPoints).sort((a, b) => b.amp - a.amp);
    
    const ctx1 = document.getElementById('canvas-passo1')?.getContext('2d');
    const ctx2 = document.getElementById('canvas-passo2')?.getContext('2d');
    const ctx3 = document.getElementById('canvas-passo3')?.getContext('2d');

    let time = 0;
    let path = [];

    function drawSteps() {
        if (!ctx1 || document.getElementById('slide-4').offsetParent === null) {
            requestAnimationFrame(drawSteps);
            return;
        }

        const dt = (2 * Math.PI) / starPoints.length;

        [ctx1, ctx2, ctx3].forEach(ctx => {
            ctx.clearRect(0, 0, 200, 150);
            ctx.save();
            ctx.translate(100, 75);
        });

        // PASSO 1: 
        ctx1.fillStyle = '#00ffcc';
        starPoints.forEach((p, i) => {
            if (i % 5 === 0) ctx1.fillRect(p.x-1, p.y-1, 2, 2);
        });

        // PASSO 2: os círculos (exibição de 15)
        let x2 = 0, y2 = 0;
        for (let i = 0; i < Math.min(fourierStar.length, 15); i++) {
            let prevx = x2; let prevy = y2;
            let { freq, amp, phase } = fourierStar[i];
            x2 += amp * Math.cos(freq * time + phase);
            y2 += amp * Math.sin(freq * time + phase);
            ctx2.beginPath();
            ctx2.strokeStyle = 'rgba(0, 255, 204, 0.2)';
            ctx2.arc(prevx, prevy, amp, 0, Math.PI * 2);
            ctx2.stroke();
        }

        // PASSO 3
        let x3 = 0, y3 = 0;
        for (let i = 0; i < fourierStar.length; i++) {
            let { freq, amp, phase } = fourierStar[i];
            x3 += amp * Math.cos(freq * time + phase);
            y3 += amp * Math.sin(freq * time + phase);
        }
        path.unshift({x: x3, y: y3});
        
        ctx3.beginPath();
        ctx3.strokeStyle = '#00ffcc';
        ctx3.lineWidth = 2;
        path.forEach((p, i) => {
            if (i === 0) ctx3.moveTo(p.x, p.y);
            else ctx3.lineTo(p.x, p.y);
        });
        ctx3.stroke();

        if (path.length > starPoints.length) path.pop();

        [ctx1, ctx2, ctx3].forEach(ctx => ctx.restore());
        
        time += dt; 
        requestAnimationFrame(drawSteps);
    }

    drawSteps();
})();