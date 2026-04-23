(function() {
    const canvas2 = document.getElementById('fourierComplexa');
    if (!canvas2) return; // Segurança caso o elemento não exista
    const ctx2 = canvas2.getContext('2d');

    // Ajusta o tamanho do canvas internamente
    canvas2.width = 800;
    canvas2.height = 400;

    let points = [
        {x: 100, y: 0}, {x: 80, y: 40}, {x: 0, y: 100}, {x: -80, y: 40}, 
        {x: -100, y: 0}, {x: -80, y: -40}, {x: 0, y: -100}, {x: 80, y: -40}
    ];

    function dft(x) {
        const X = [];
        const N = x.length;
        for (let k = 0; k < N; k++) {
            let re = 0; let im = 0;
            for (let n = 0; n < N; n++) {
                const phi = (2 * Math.PI * k * n) / N;
                re += x[n].x * Math.cos(phi) + x[n].y * Math.sin(phi);
                im += -x[n].x * Math.sin(phi) + x[n].y * Math.cos(phi);
            }
            X[k] = { 
                freq: k, 
                amp: Math.sqrt(re * re + im * im) / N, 
                phase: Math.atan2(im, re) 
            };
        }
        return X;
    }

    const fourier = dft(points);
    fourier.sort((a, b) => b.amp - a.amp);

    let time = 0;
    let path = [];

    function animate() {
        // Só desenha se o slide estiver visível (display != none)
        if (canvas2.offsetParent !== null) {
            ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
            
            let x = canvas2.width / 2;
            let y = canvas2.height / 2;

            for (let i = 0; i < fourier.length; i++) {
                let prevx = x;
                let prevy = y;
                let { freq, amp, phase } = fourier[i];
                
                // Escala para o desenho ficar visível (amp * 2 por exemplo)
                let radius = amp * 1.5; 
                x += radius * Math.cos(freq * time + phase);
                y += radius * Math.sin(freq * time + phase);

                ctx2.beginPath();
                ctx2.strokeStyle = 'rgba(0, 255, 204, 0.2)';
                ctx2.arc(prevx, prevy, radius, 0, Math.PI * 2);
                ctx2.stroke();

                ctx2.beginPath();
                ctx2.strokeStyle = 'white';
                ctx2.moveTo(prevx, prevy);
                ctx2.lineTo(x, y);
                ctx2.stroke();
            }

            path.unshift({x, y});

            ctx2.beginPath();
            ctx2.strokeStyle = '#ff0077';
            ctx2.lineWidth = 2;
            for (let i = 0; i < path.length; i++) {
                ctx2.lineTo(path[i].x, path[i].y);
            }
            ctx2.stroke();

            time += 0.05;
            if (path.length > 200) path.pop();
        }
        requestAnimationFrame(animate);
    }

    animate();
})();