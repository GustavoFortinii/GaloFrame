const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// === Prisma 7 + SQLite ===
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

// Usando a URL (forma recomendada no Prisma 7)
const adapter = new PrismaBetterSqlite3({
    url: "file:./prisma/dev.db"   // ← Importante: use este formato
});

const prisma = new PrismaClient({
    adapter,
    // log: ['query', 'info', 'warn', 'error'] // descomente se quiser ver as queries
});

// ==================== RESTO DO SEU CÓDIGO (sem alteração) ====================
const app = express();
const JWT_SECRET = 'MassaAtleticana13';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Middleware para proteger rotas e descobrir QUAL usuário está fazendo a requisição
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Acesso negado. Faça login para continuar.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Sessão expirada. Faça login novamente.' });
        req.user = user;
        next();
    });
};

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Cadastro de novos Atleticanos
app.post('/api/auth/register', async (req, res) => {
    const { email, username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: { email, username, password: hashedPassword }
        });
        res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        res.status(400).json({ error: 'Email ou Nome de usuário já cadastrado.' });
    }
});

// Login do Usuário
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Aceita fazer login tanto por email quanto por nome de usuário
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username: email }]
            }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
        }

        // Gera o token de acesso que expira em 1 dia
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// ==================== ROTAS DOS MOMENTOS (MEMORIES) ====================

// Buscar apenas os momentos DO USUÁRIO LOGADO (para mostrar no Studio)
app.get('/api/memories/my', authenticateToken, async (req, res) => {
    const memories = await prisma.memory.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
    });
    res.json(memories);
});

// Buscar os momentos de TODO MUNDO (para mostrar no Feed Geral)
app.get('/api/memories/feed', authenticateToken, async (req, res) => {
    const memories = await prisma.memory.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { username: true } } // Traz o nome do criador da publicação
        }
    });
    res.json(memories);
});

// Buscar um momento específico por ID (usado na tela de edição)
app.get('/api/memories/:id', authenticateToken, async (req, res) => {
    const memory = await prisma.memory.findUnique({
        where: { id: req.params.id }
    });

    if (!memory) return res.status(404).json({ error: 'Momento não encontrado.' });
    if (memory.userId !== req.user.id) return res.status(403).json({ error: 'Não autorizado.' });

    res.json(memory);
});

// Salvar um novo momento vinculado ao usuário autenticado
app.post('/api/memories', authenticateToken, async (req, res) => {
    const { title, description, date, tags, imageData } = req.body;
    try {
        const newMemory = await prisma.memory.create({
            data: {
                title,
                description,
                date,
                tags,
                imageData,
                userId: req.user.id
            }
        });
        res.status(201).json(newMemory);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar o momento no banco.' });
    }
});

// Deletar um momento (só deixa apagar se for dono dele)
app.delete('/api/memories/:id', authenticateToken, async (req, res) => {
    try {
        const memory = await prisma.memory.findUnique({ where: { id: req.params.id } });

        if (!memory) return res.status(404).json({ error: 'Momento não encontrado.' });
        if (memory.userId !== req.user.id) return res.status(403).json({ error: 'Apenas o dono pode apagar este momento.' });

        await prisma.memory.delete({ where: { id: req.params.id } });
        res.json({ message: 'Momento excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir o momento.' });
    }
});

// Rotas para servir os HTMLs de forma amigável
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/home', (req, res) => res.sendFile(path.join(__dirname, 'public', 'home.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/feed', (req, res) => res.sendFile(path.join(__dirname, 'public', 'feed.html')));
app.get('/studio', (req, res) => res.sendFile(path.join(__dirname, 'public', 'studio.html')));
app.get('/editor', (req, res) => res.sendFile(path.join(__dirname, 'public', 'editor.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

app.listen(3000, () => {
    console.log('🐔 GaloFrame rodando com banco de dados centralizado em http://localhost:3000');
});