document.addEventListener('DOMContentLoaded', function() {

    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.error("Formulário não encontrado!");
        return;
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Usando o ID correto que está no HTML
        const identifier = document.getElementById('username').value.trim();  // ← corrigido
        const password = document.getElementById('password').value;

        const errorMsg = document.getElementById('errorMessage');
        const btn = document.querySelector('.login-btn');

        if (btn) btn.disabled = true;
        if (errorMsg) errorMsg.textContent = '';

        if (!identifier || !password) {
            if (errorMsg) errorMsg.textContent = 'Preencha todos os campos!';
            if (btn) btn.disabled = false;
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: identifier,   // O backend aceita email ou username
                    password 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Usuário ou senha incorretos.');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);

            // Redireciona após login bem-sucedido
            window.location.href = "/feed";

        } catch (error) {
            if (errorMsg) {
                errorMsg.textContent = error.message;
            } else {
                alert(error.message);
            }
        } finally {
            if (btn) btn.disabled = false;
        }
    });
});