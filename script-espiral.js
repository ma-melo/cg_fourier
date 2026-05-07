(function() {
    const canvas = document.getElementById('complexSinusoidCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animAmt = 0;
    let xzAngle = Math.PI / 2; 
    const transitionFactor = 0.03; // Transição de câmera mais suave
    
    const radius = 60;
    const length = 320;

    function to2d(x, y, z, xzAngle, yAngle) {
        // Rotação Y
        let newX = x * Math.cos(xzAngle) + z * Math.sin(xzAngle);
        let newZ = -x * Math.sin(xzAngle) + z * Math.cos(xzAngle);
        // Rotação X
        let finalY = y * Math.cos(yAngle) - newZ * Math.sin(yAngle);
        return { x: newX, y: finalY };
    }

    function drawBox(xzAngle, yAngle) {
        ctx.beginPath();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;

        // Definimos os 8 vértices da caixa
        const w = length / 2;
        const r = radius;
        const vertices = [
            {x: -w, y: -r, z: -r}, {x: w, y: -r, z: -r},
            {x: w, y: r, z: -r}, {x: -w, y: r, z: -r},
            {x: -w, y: -r, z: r}, {x: w, y: -r, z: r},
            {x: w, y: r, z: r}, {x: -w, y: r, z: r}
        ];

        const projected = vertices.map(v => to2d(v.x, v.y, v.z, xzAngle, yAngle));

        // Desenhar arestas (lógica de conexão de cubos)
        const connections = [
            [0,1], [1,2], [2,3], [3,0], // Fundo
            [4,5], [5,6], [6,7], [7,4], // Frente
            [0,4], [1,5], [2,6], [3,7]  // Conexões laterais
        ];

        connections.forEach(pair => {
            ctx.moveTo(projected[pair[0]].x, projected[pair[0]].y);
            ctx.lineTo(projected[pair[1]].x, projected[pair[1]].y);
        });
        ctx.stroke();
    }

    function animate() {
        if (canvas.offsetParent !== null) {
            canvas.width = 800;
            canvas.height = 250;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);

            // Alternância de ângulo (oscilação mais lenta)
            let cycle = Math.sin(Date.now() * 0.0006); 
            let desiredAngle = cycle > 0 ? Math.PI / 2 : 0;
            
            // Quando de frente (0), o yAngle deve ser 0 para ver o círculo perfeito
            // Quando de lado (PI/2), usamos 0.2 para dar um charme 3D
            let yAngle = (xzAngle < 0.2) ? 0 : 0.2; 

            xzAngle += transitionFactor * (desiredAngle - xzAngle);

            // 1. Desenha a caixa primeiro (atrás)
            drawBox(xzAngle, yAngle);

            // Senoide
            ctx.beginPath();
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 3;
            
            // (velocidade de rotação da onda)
            animAmt += 0.008; 

            for (let i = 0; i < 250; i++) {
                let amt = i / 249;
                let x = length * (amt - 0.5);
                
                // y = sin (Imaginário), z = cos (Real)
                let y = radius * Math.sin(2 * Math.PI * (2 * amt - animAmt));
                let z = radius * Math.cos(2 * Math.PI * (2 * amt - animAmt));

                let pos = to2d(x, y, z, xzAngle, yAngle);

                if (i === 0) ctx.moveTo(pos.x, pos.y);
                else ctx.lineTo(pos.x, pos.y);
            }
            ctx.stroke();
            
            // 3. Desenha um ponto na ponta para ajudar a ver o círculo
            let headY = radius * Math.sin(2 * Math.PI * (2 * 1 - animAmt));
            let headZ = radius * Math.cos(2 * Math.PI * (2 * 1 - animAmt));
            let headPos = to2d(length * 0.5, headY, headZ, xzAngle, yAngle);
            
            ctx.beginPath();
            ctx.fillStyle = '#fff';
            ctx.arc(headPos.x, headPos.y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
        requestAnimationFrame(animate);
    }

    animate();
})();