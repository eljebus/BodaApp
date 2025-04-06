

class PhotoHandler {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.selectedPhoto = null;
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {




            this.setupButtons();

            var elems = document.querySelectorAll('.fixed-action-btn');
            var instances = M.FloatingActionButton.init(elems, {'direction': 'left','hoverEnabled': false});
            var elems = document.querySelectorAll('.modal');
           
            var instances = M.Modal.init(elems, {});


            

            // Add event listener to elements with the class 'masonry-item'
            $('.masonry-item').on('click',this.setPhotoView.bind(this));

            $("#descargar").on("click", this.downloadPhoto.bind(this));
            $("#compartir").on("click", this.sharePhoto.bind(this));

            if (!navigator.share) {
              $("#compartir").hide();
            }

        });
    }


    setPhotoView(e) {
        const clickedElement = e.currentTarget;
        const imgElement = clickedElement.querySelector('img');
        if (imgElement) {
            const imgSrc = imgElement.src;
            console.log('Image source:', imgSrc);
            document.getElementById("modal-image").src = imgSrc;
            document.getElementById("photo-modal").style.top = "0%";
        }
    }

    setupButtons() {
        const galleryIcon = document.getElementById('galery-icon');
        const cameraIcon = document.getElementById('camera-icon');

        if (galleryIcon) {
            galleryIcon.addEventListener('click', () => this.openGallery());
        }

        if (cameraIcon) {
            cameraIcon.addEventListener('click', () => this.openNativeCamera());
        }
    }

    openGallery() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.selectedPhoto = e.target.files[0];
                this.uploadPhoto();
            }
        });

        fileInput.click();
    }

    sharePhoto() {
        // Verificar si la API de compartir está disponible
       
        
        const img = document.querySelector(selector);
        if (!img || img.tagName !== 'IMG') return;
        
        // Si es URL web, compartir directamente
        if (img.src.startsWith('http')) {
          navigator.share({
            title, text, url: img.src
          }).catch(e => console.error(e));
          return;
        }
        
        // Convertir y compartir como archivo
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
          const file = new File([blob], 'imagen.jpg', {type: 'image/jpeg'});
          
          if (navigator.canShare && navigator.canShare({files: [file]})) {
            navigator.share({
              title, text, files: [file]
            }).catch(e => console.error(e));
          } else {
            // Fallback: compartir la URL actual
            navigator.share({
              title, text, url: window.location.href
            }).catch(e => console.error(e));
          }
        }, 'image/jpeg', 0.9);
    }

    downloadPhoto() {
      const imgElement = document.querySelector('#modal-image');
      if (!imgElement || !imgElement.src) {
        alert('No hay ninguna foto seleccionada para descargar.');
        return;
      }

      const url = imgElement.src;
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
      a.download = `photo_${timestamp}.jpg`; // Genera el nombre del archivo con fecha y hora
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }



    openNativeCamera() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.capture = 'environment';

        // Set attributes to prioritize high-quality images
        fileInput.setAttribute('quality', 'high');
        fileInput.setAttribute('resolution', 'high');

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.selectedPhoto = e.target.files[0];
                this.uploadPhoto();
            }
        });

        fileInput.click();
    }


    async  compressImage(file, maxWidth = 1024, quality = 0.75) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const scale = Math.min(maxWidth / img.width, 1);
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              canvas.toBlob((blob) => {
                resolve(new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                }));
              }, 'image/jpeg', quality);
            };
          };
          reader.readAsDataURL(file);
        });
      }
      
      async uploadPhoto() {
        if (!this.selectedPhoto) return;
      
        // Mostrar elemento de carga y deshabilitar menú
        const loadingElement = document.getElementById('cargando');
        const menuButton = document.getElementById('mainControl');
        
        if (loadingElement) {
          loadingElement.style.display = 'block';
          // Scroll al inicio cuando se muestra el elemento de carga
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
        if (menuButton) menuButton.style.display = 'none';
      
        try {
          const processedFile = this.selectedPhoto.type.startsWith('image/')
            ? await this.compressImage(this.selectedPhoto)
            : this.selectedPhoto;
      
          const formData = new FormData();
          formData.append('photo', processedFile);
      
          const uploadURL = `/subir-foto?timestamp=${Date.now()}`;
          const response = await fetch(uploadURL, {
            method: 'POST',
            body: formData,
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
      
          if (!response.ok) throw new Error('Error al subir la foto');
      
          const json = await response.json();
          const nuevaFotoURL = json.url;
      
          // Redirige al álbum con la nueva imagen en la query
          window.location.href = `/album?nueva=${encodeURIComponent(nuevaFotoURL)}`;
      
        } catch (error) {
          console.error('Error:', error);
          alert('Error al subir la foto: ' + error.message);
        } finally {
          // Ocultar elemento de carga y rehabilitar menú
          if (loadingElement) loadingElement.style.display = 'none';
          if (menuButton) menuButton.style.pointerEvents = 'auto';
        }
      }
}

// Ejemplo de uso:
// <div id="photo-container"></div>
// <button id="gallery-icon">Abrir galería</button>
// <button id="camera-icon">Tomar foto</button>
const photoHandler = new PhotoHandler('photo-container');
photoHandler.init();
