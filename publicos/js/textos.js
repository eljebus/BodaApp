

class Textos {
    constructor(containerId) {
        $(document).ready(() => {
            this.init();
        });
    }

    init() {

        
        $("#formulario").hide(); 
        $("#pencil-icon").on("click",this.showForm.bind(this));
        $("#compartirTexto").on("click",this.saveText.bind(this)); // Bind the context of 'this' to the method
    }

    showForm() {
        $("#formulario").toggle();
        $('html, body').animate({
            scrollTop: 0
        }, 500); // 500ms for smooth scrolling to the top
    }

    saveText(){

        $("#compartirTexto").prop("disabled", true);
        $("#compartirTexto").html("Guardando...");
        const nombre = $("#nombre").val();
        const deseo = $("#deseo").val();
        const url = "/guardar-texto"; // URL del controlador para guardar el texto

        $.ajax({
            type: "POST",
            url: url,
            data: { nombre: nombre, deseo: deseo },
            success: function(response) {
                console.log("Texto guardado exitosamente:", response);
                location.reload(); // Recargar la página después de guardar el texto
                // Aquí puedes agregar lógica adicional después de guardar el texto
            },
            error: function(xhr, status, error) {
                console.error("Error al guardar el texto:", error);
                // Manejo de errores
            }
        });
    }

 
}


const miTextos = new Textos();
