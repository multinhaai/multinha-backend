require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const OpenAI = require('openai');
const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/gerar-contestacao', async (req, res) => {
  const dados = req.body;

  console.log("🟡 Recebido do formulário:", dados); // mostra o que o usuário preencheu

  try {
    const prompt = `Aja como um advogado brasileiro especializado em infrações de trânsito. Com base nas informações a seguir, redija uma contestação formal e bem fundamentada para cancelar ou postergar a penalidade:

Nome: ${dados.nome}
CPF: ${dados.cpf}
E-mail: ${dados.email}
Telefone: ${dados.telefone}
Auto de Infração: ${dados.numero_multa}
Placa: ${dados.placa}
Data da infração: ${dados.data_infracao}
Data da notificação: ${dados.data_notificacao || "Não informada"}
Explicação: ${dados.explicacao || "Nenhuma"}`;

    console.log("🟢 Prompt enviado ao ChatGPT:\n", prompt);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const textoDefesa = response.choices[0].message.content;
    console.log("🔵 Contestação gerada pelo GPT:\n", textoDefesa);

    // A partir daqui, segue seu código de gerar PDF, enviar e-mail etc...
    // (mantenha o restante igual)

  } catch (error) {
    console.error("❌ Erro ao processar a contestação:", error);
    res.status(500).send({ error: error.message });
  }
});
