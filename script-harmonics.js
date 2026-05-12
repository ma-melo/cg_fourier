(function() {
    const canvas = document.getElementById('harmonicsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const slider = document.getElementById('harmonics-slider');
    const display = document.getElementById('harmonics-val');

    let time = 0;

    function draw() {
        if (canvas.offsetParent !== null) {
            canvas.width = 800;
            canvas.height = 300; 
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const nHarmonics = parseInt(slider.value);
            display.innerText = nHarmonics;

            // -------------------------------
            // Lado Esquerdo: onda resultante 
            ctx.save();
            ctx.translate(50, 150); // Posicionada no topo
            
            // Desenhar linha de base
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.moveTo(0,0); ctx.lineTo(300,0);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = '#4fc3f7';
            ctx.lineWidth = 3;

            for (let x = 0; x < 300; x++) {
                let y = 0;
                for (let n = 1; n <= nHarmonics; n += 2) { //a onda quadrada só tem harmonicos ímpares
                    y += (4 / (n * Math.PI)) * Math.sin(n * (x * 0.05 - time)); // soma os harmonicos
                }
                let py = y * 60; 
                if (x === 0) ctx.moveTo(x, py);
                else ctx.lineTo(x, py);
            }
        ctx.stroke();
        ctx.restore();

        // -------------------------------------------
            //  Lado Direito: harmonicos empilhados 
            const startX = 450;
            const startY = 100;
            const spacing = Math.min(30, 450 / (nHarmonics / 2 + 1)); // Ajusta espaço conforme a quantidade
            
            const colors = ['#ff0055', '#ffcc00', '#00ccff', '#cc00ff', '#ffffff'];
            
            for (let n = 1, j = 0; n <= nHarmonics; n += 2, j++) {
                ctx.save();
                ctx.translate(startX, startY + (j * spacing)); //move harmônico para baixo 
                
                ctx.beginPath();
                ctx.strokeStyle = colors[j % colors.length];
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = Math.max(0.2, 1 - (j * 0.05)); //muda opacidade

                for (let x = 0; x < 300; x++) {
                    let y = (4 / (n * Math.PI)) * Math.sin(n * (x * 0.05 - time));
                    let py = y * 40; 
                    if (x === 0) ctx.moveTo(x, py);
                    else ctx.lineTo(x, py);
                }
                ctx.stroke();
                ctx.restore();
            }

            
            ctx.fillStyle = "white";
            ctx.font = "bold 16px monospace";
            ctx.fillText("ONDA QUADRADA (SOMA)", 50, 50);
            ctx.fillText("COMPONENTES (SÉRIE)", 450, 50);
            
            ctx.font = "12px monospace";
            ctx.fillStyle = "#888";
            ctx.fillText("Frequência fundamental no topo → Harmônicos de alta frequência abaixo", 450, 70);

            time += 0.05;
        }
        requestAnimationFrame(draw);
    }

    draw();
})();