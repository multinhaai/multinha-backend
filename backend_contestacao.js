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

  const prompt = 
    "Aja como um advogado brasileiro especializado em infrações de trânsito. Com base nas informações a seguir, redija uma contestação formal e bem fundamentada para cancelar ou postergar a penalidade:\n\n" +
    "Nome: " + dados.nome + "\n" +
    "CPF: " + dados.cpf + "\n" +
    "E-mail: " + dados.email + "\n" +
    "Telefone: " + dados.telefone + "\n" +
    "Auto de Infração: " + dados.numero_multa + "\n" +
    "Placa: " + dados.placa + "\n" +
    "Data da infração: " + dados.data_infracao + "\n" +
    "Data da notificação: " + dados.data_notificacao + "\n" +
    "Relato do condutor: " + (dados.explicacao || 'Não informado') + "\n\n" +
    "Finalize com solicitação de deferimento e assinatura.";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: prompt }]
    });

    const textoDefesa = response.choices[0].message.content;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const lines = textoDefesa.match(/.{1,90}/g) || [];
    let y = 800;
    lines.forEach(line => {
      page.drawText(line, { x: 50, y, size: 11, font });
      y -= 15;
    });

    const pdfBytes = await pdfDoc.save();
    const filePath = `./contestacao_${Date.now()}.pdf`;
    fs.writeFileSync(filePath, pdfBytes);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_REMETENTE,
        pass: process.env.EMAIL_SENHA
      }
    });

    await transporter.sendMail({
      from: `Multinha <${process.env.EMAIL_REMETENTE}>`,
      to: dados.email,
      subject: 'Sua Contestação Está Pronta',
      text: 'Segue em anexo sua defesa gerada com inteligência artificial.',
      attachments: [{ filename: 'contestacao.pdf', path: filePath }]
    });

    fs.unlinkSync(filePath);
    res.send({ status: 'ok', message: 'Contestação enviada por e-mail com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Erro ao processar a contestação' });
  }
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
