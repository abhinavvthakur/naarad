const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const token = '6022480242:AAEIzFuwrT_Ld7-HUcb3zFwT4YcBGQQU4kE';
const bot = new TelegramBot(token, { polling: true });

const homeUrl = 'https://parivahan.gov.in/rcdlstatus/';
const postUrl = 'https://parivahan.gov.in/rcdlstatus/vahan/rcDlHome.xhtml';

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Please provide the vehicle registration details in the format: /checkRegistration <registrationNumber>');
});

bot.onText(/\/checkRegistration (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const registrationNumber = match[1];

  const first = registrationNumber.slice(0, -4);
  const second = registrationNumber.slice(-4);

  try {
    const imgPath = 'downloadedpng.png';
    const captchaText = await resolve(imgPath);
    const extractedText = captchaText.replace(/ /g, '').replace(/\n/g, '');

    const data = new URLSearchParams();
    data.append('javax.faces.partial.ajax', 'true');
    data.append('javax.faces.source', button.id);
    data.append('javax.faces.partial.execute', '@all');
    data.append('javax.faces.partial.render', 'form_rcdl:pnl_show form_rcdl:pg_show form_rcdl:rcdl_pnl');
    data.append(button.id, button.id);
    data.append('form_rcdl', 'form_rcdl');
    data.append('form_rcdl:tf_reg_no1', first);
    data.append('form_rcdl:tf_reg_no2', second);
    data.append('form_rcdl:j_idt34:CaptchaID', extractedText);
    data.append('javax.faces.ViewState', viewstate);

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/xml, text/xml, */*; q=0.01',
      'Accept-Language': 'en-us',
      'Accept-Encoding': 'gzip, deflate, br',
      Host: 'parivahan.gov.in',
      DNT: '1',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0 Safari/605.1.15',
      'X-Requested-With': 'XMLHttpRequest',
      'Faces-Request': 'partial/ajax',
      Origin: 'https://parivahan.gov.in',
      Referer: 'https://parivahan.gov.in/rcdlstatus/',
      Connection: 'keep-alive',
    };

    await sleep(2000);

    const response = await axios.post(postUrl, data.toString(), { headers });
    const html = response.data;
    const tableRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = html.match(tableRegex);

    let result = '';
    rows.forEach(row => {
      const rowText = row.replace(/<[^>]*>?/gm, '');
      result += rowText + '\n';
    });

    bot.sendMessage(chatId, result);
  } catch (error) {
    bot.sendMessage(chatId, 'An error occurred. Please try again later.');
  }
});

async function resolve(imgPath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imgPath));

  const config = {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
    },
  };

  const response = await axios.post('https://api.ocr.space/parse/image', formData, config);
  const { ParsedResults } = response.data;

  return ParsedResults[0].ParsedText.replace(/\s/g, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
