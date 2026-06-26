let images = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadImages();
    renderGallery();
});

async function loadImages() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // Busca exclusivamente as imagens DO usuário logado
        const response = await fetch('/api/memories/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            images = await response.json();
        }
    } catch (error) {
        console.error("Erro ao carregar estúdio:", error);
    }
}

function renderGallery() {
    const grid = document.getElementById('imageGrid');
    const emptyMessage = document.getElementById('emptyMessage');
    if (!grid) return;

    grid.innerHTML = '';

    if (images.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }

    if (emptyMessage) emptyMessage.style.display = 'none';

    images.forEach((memory) => {
        const imgElement = document.createElement('img');
        imgElement.src = memory.imageData;
        imgElement.alt = memory.title;
        
        imgElement.addEventListener('click', () => {
            // Salva o ID do Prisma temporariamente
            localStorage.setItem('currentEditId', memory.id);
            window.location.href = 'editor.html';
        });

        grid.appendChild(imgElement);
    });
}

function openUploadModal() {
    const input = document.getElementById('imageUpload');
    if (input) input.click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const title = prompt("Dê um título para esse momento alvinegro:") || "Momento Galo";
        const description = prompt("O que aconteceu nesse dia?") || "Registrado no GaloFrame.";
        const tagInput = prompt("Adicione uma tag:") || "galo";

        const token = localStorage.getItem('token');

        try {
            // Envia os dados para a API do back-end salvar no SQLite vinculado ao Usuário
            const response = await fetch('/api/memories', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title,
                    description,
                    date: new Date().toISOString().split('T')[0],
                    tags: tagInput.toLowerCase().replace('#', ''),
                    imageData: e.target.result
                })
            });

            if (response.ok) {
                await loadImages();
                renderGallery();
            } else {
                const err = await response.json();
                alert(err.error);
            }
        } catch (error) {
            console.error("Erro ao enviar imagem:", error);
        }
        event.target.value = '';
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('imageUpload');
    if (uploadInput) uploadInput.addEventListener('change', handleImageUpload);
});

window.openUploadModal = openUploadModal;