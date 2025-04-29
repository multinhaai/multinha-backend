require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const uri = 'mongodb+srv://multinhaai:YhHMoP7irE6oRpp6@cluster0.xwl2iln.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(uri);
let db;

client.connect().then(() => {
  db = client.db('multinha');
  console.log('🟢 Conectado ao MongoDB Atlas');
});

// Função para gerar JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Rota de cadastro
app.post('/register', async (req, res) => {
  const { nome, email, senha } = req.body;

  const usuarioExistente = await db.collection('usuarios').findOne({ email });
  if (usuarioExistente) {
    return res.status(400).json({ error: 'Usuário já cadastrado com este e-mail' });
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);
  const resultado = await db.collection('usuarios').insertOne({ nome, email, senha: senhaCriptografada });

  const token = generateToken(resultado.insertedId);
  res.json({ token });
});

// Rota de login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  const usuario = await db.collection('usuarios').findOne({ email });
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = generateToken(usuario._id);
  res.json({ token });
});

app.listen(3000, () => {
  console.log('🔐 Autenticação rodando em http://localhost:3000');
});
