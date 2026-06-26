// ==================== GaloFrame - Editor JS (Multi-usuário) ====================

let currentImageId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCurrentImage();
});

async function loadCurrentImage() {
    currentImageId = localStorage.getItem('currentEditId');
    const token = localStorage.getItem('token');

    if (!currentImageId) {
        alert("Nenhuma imagem encontrada para edição!");
        window.location.href = 'studio.html';
        return;
    }

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const imgElement = document.getElementById('previewImage');
    
    try {
        // Busca a imagem direto do back-end Node/Prisma passando o token de autenticação
        const response = await fetch(`/api/memories/${currentImageId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok && imgElement) {
            imgElement.src = data.imageData;
        } else {
            alert(data.error || "Registro não encontrado!");
            window.location.href = 'studio.html';
        }
    } catch (error) {
        console.error("Erro ao carregar dados do servidor:", error);
    }
}

function saveAndGoBack() {
    localStorage.removeItem('currentEditId');
    window.location.href = 'studio.html';
}

async function deleteCurrentImage() {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

    const token = localStorage.getItem('token');
    
    if (currentImageId && token) {
        try {
            // Dispara o DELETE para o back-end apagar no banco SQLite
            const response = await fetch(`/api/memories/${currentImageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                localStorage.removeItem('currentEditId');
                window.location.href = 'studio.html';
            } else {
                const data = await response.json();
                alert(data.error || "Erro ao excluir o registro.");
            }
        } catch (error) {
            console.error("Erro ao deletar:", error);
            alert("Erro ao conectar com o servidor.");
        }
    }
}

function postImage() {
    alert("✅ Imagem disponível no Feed Geral da Massa! 🐔");
    localStorage.removeItem('currentEditId');
    window.location.href = 'feed.html';
}

// Expor funções para os atributos onclick legados do HTML
window.saveAndGoBack = saveAndGoBack;
window.deleteCurrentImage = deleteCurrentImage;
window.postImage = postImage;