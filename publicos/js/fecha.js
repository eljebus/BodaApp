window.onload = function () {
    // Fecha objetivo: 7 de junio a las 4:30 PM
    const fechaObjetivo = new Date('2024-06-07T16:30:00');
    const ahora = new Date();

    // Verificar si existe un elemento específico
    const albumElement = document.querySelector('#album');
    const textosElement = document.querySelector('#textos');

    // Verificar si existe alguno de los elementos y si aún no es la fecha objetivo
    if ((albumElement || textosElement) && ahora < fechaObjetivo) {
        // Si existe el elemento album, ocultarlo
        if (albumElement) {
            albumElement.style.display = 'none';
        }
        
        // Si existe el elemento textos, ocultarlo
        if (textosElement) {
            textosElement.style.display = 'none';
        }
        
        // Añadir texto al body
        const nuevoTexto = document.createElement('div');
        nuevoTexto.id = 'hastaFecha';
        nuevoTexto.innerHTML = `
            <CENTER>
                <h5>Esta funcion estará disponible el día de nuestra boda</h5>
                <i class="material-icons" style="color: rgb(0, 140, 255); font-size: 48px;">favorite</i>
                <br>
                <a href="/" class="waves-effect waves-light btn">Volver</a>
            </CENTER>
        `;
        document.body.appendChild(nuevoTexto);
    }
};
