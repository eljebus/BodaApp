    $(window).on('load', function () {
        // Verifica que los elementos existan antes de aplicar los efectos
        if ($("#luna").length && $("#principal").length) {
            // Desvanece la imagen con id "luna"
            $("#luna").fadeOut(2000, function () {
                // Una vez que "luna" se desvanezca, muestra la imagen con id "principal"
                $("#principal").hide().fadeIn(1000);
            });
        } else {
            console.error("Los elementos #luna o #principal no existen en el DOM.");
        }

        const targetDate = new Date('June 7, 2025 5:00:00').getTime();

        function updateCountdown() {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                document.getElementById('days').textContent = '00';
                document.getElementById('hours').textContent = '00';
                document.getElementById('minutes').textContent = '00';
                document.getElementById('seconds').textContent = '00';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            // document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

       
        }

        setInterval(updateCountdown, 1000);
    });
