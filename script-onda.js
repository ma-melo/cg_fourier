(function () {

    const canvas = document.getElementById("onda");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    canvas.width = 900;
    canvas.height = 400;

    let offset = 0;

    function drawSquareWave() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();

        ctx.strokeStyle = "#4fc3f7";
        ctx.lineWidth = 3;

        const amplitude = 80;
        const centerY = canvas.height / 2;

        const wavelength = 120;

        for (let x = 0; x < canvas.width; x++) {

            const shiftedX = x + offset;

            const phase = Math.floor(shiftedX / wavelength);

            const y = phase % 2 === 0
                ? centerY - amplitude
                : centerY + amplitude;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {

                // cria a descontinuidade vertical
                const prevShifted = (x - 1) + offset;

                const prevPhase = Math.floor(prevShifted / wavelength);

                const prevY = prevPhase % 2 === 0
                    ? centerY - amplitude
                    : centerY + amplitude;

                if (prevY !== y) {

                    ctx.lineTo(x, prevY);
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // movimento da direita para esquerda
        offset += 2;

        requestAnimationFrame(drawSquareWave);
    }

    drawSquareWave();

})();