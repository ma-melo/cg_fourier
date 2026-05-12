(function() {
    const canvas = document.getElementById('fourierComplexa');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. DEFINIÇÃO DOS VÉRTICES DO CUBO (Coordenadas 3D + W para Homogêneas)
    const size = 60;
    const vertices = [
        {x: -size, y: -size, z:  size, w: 1}, {x:  size, y: -size, z:  size, w: 1},
        {x:  size, y:  size, z:  size, w: 1}, {x: -size, y:  size, z:  size, w: 1},
        {x: -size, y: -size, z: -size, w: 1}, {x:  size, y: -size, z: -size, w: 1},
        {x:  size, y:  size, z: -size, w: 1}, {x: -size, y:  size, z: -size, w: 1}
    ];

    // Ordem para desenhar o cubo em um único traço contínuo
    const sequence = [0, 1, 2, 3, 0, 4, 5, 6, 7, 4, 5, 1, 2, 6, 7, 3];
    const cubePath = sequence.map(idx => vertices[idx]);

    // Transformada de Fourier Discreta  para sinal 3D (Retorna componentes para X, Y e Z)
    function dft3D(points) {
        const N = points.length;
        const res = { x: [], y: [], z: [] };

        const computeDFT = (vals) => {
            const X = [];
            for (let k = 0; k < N; k++) {
                let re = 0, im = 0;
                for (let n = 0; n < N; n++) {
                    const phi = (2 * Math.PI * k * n) / N;
                    re += vals[n] * Math.cos(phi);
                    im -= vals[n] * Math.sin(phi);
                }
                X[k] = { freq: k, amp: Math.sqrt(re*re + im*im)/N, phase: Math.atan2(im, re) };
            }
            return X;
        };

        res.x = computeDFT(points.map(p => p.x));
        res.y = computeDFT(points.map(p => p.y));
        res.z = computeDFT(points.map(p => p.z));
        return res;
    }

    const fourier = dft3D(cubePath);
    let time = 0;
    let path = [];

    // MATRIZES E TRANSFORMAÇÕES HOMOGÊNEAS
    function multiplyMatrixVector(m, v) {
        return {
            x: m[0][0]*v.x + m[0][1]*v.y + m[0][2]*v.z + m[0][3]*v.w,
            y: m[1][0]*v.x + m[1][1]*v.y + m[1][2]*v.z + m[1][3]*v.w,
            z: m[2][0]*v.x + m[2][1]*v.y + m[2][2]*v.z + m[2][3]*v.w,
            w: 1
        };
    }

    function rotate3D(ax, ay) {
        // Rotação Y * Rotação X
        const cosX = Math.cos(ax), sinX = Math.sin(ax);
        const cosY = Math.cos(ay), sinY = Math.sin(ay);
        return [
            [cosY, 0, sinY, 0],
            [sinX*sinY, cosX, -sinX*cosY, 0],
            [-cosX*sinY, sinX, cosX*cosY, 0],
            [0, 0, 0, 1]
        ];
    }

    function animate() {
        if (canvas.offsetParent !== null) {
            canvas.width = 800; canvas.height = 300;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let current3D = { x: 0, y: 0, z: 0, w: 1 };
            
            for (let k = 0; k < fourier.x.length; k++) {
                current3D.x += fourier.x[k].amp * Math.cos(fourier.x[k].freq * time + fourier.x[k].phase);
                current3D.y += fourier.y[k].amp * Math.cos(fourier.y[k].freq * time + fourier.y[k].phase);
                current3D.z += fourier.z[k].amp * Math.cos(fourier.z[k].freq * time + fourier.z[k].phase);
            }

            const rotationMat = rotate3D(time * 0.2, time * 0.3);
            
            // Projetamos o ponto atual e todo o rastro gravado
            path.unshift(current3D);
            if (path.length > 500) path.pop();

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            
            
            ctx.beginPath(); // desenha o rastro projetado
            ctx.strokeStyle = '#ffb74d';
            ctx.lineWidth = 2;
            path.forEach((p, i) => {
                const projected = multiplyMatrixVector(rotationMat, p);
                // Efeito simples de perspectiva: escala baseada no Z
                const scale = 400 / (400 - projected.z); 
                const px = projected.x * scale;
                const py = projected.y * scale;
                
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.stroke();

            
            const head = multiplyMatrixVector(rotationMat, current3D);
            const hScale = 400 / (400 - head.z);
            ctx.beginPath();
            ctx.fillStyle = '#fff';
            ctx.arc(head.x * hScale, head.y * hScale, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            time += (2 * Math.PI) / 400;
        }
        requestAnimationFrame(animate);
    }

    animate();
})();