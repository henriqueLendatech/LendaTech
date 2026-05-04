
const MP_ACCESS_TOKEN = 'APP_USR-1010895687114921-050213-054dd87141a0b6a9f734a8b15b6166cb-827295038';
let paymentLink = '';


const navItems = document.querySelectorAll('.nav-item');
const sections = ['home', 'servicos', 'pagamento', 'contato'];

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.getAttribute('data-section');

    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');

    const targetSection = document.getElementById(section);
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY + window.innerHeight;
  let activeSection = 'home';

  sections.forEach(section => {
    const el = document.getElementById(section);
    if (el && el.offsetTop < scrollPos) {
      activeSection = section;
    }
  });

  navItems.forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-section') === activeSection);
  });
});


window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = scrollTop / docHeight;
  document.getElementById('scrollIndicator').style.transform = `scaleX(${scrollPercent})`;
});

const btnGerar = document.getElementById('btn-gerar');
const mpValor = document.getElementById('mp-valor');
const mpDesc = document.getElementById('mp-desc');
const qrArea = document.getElementById('qr-area');
const qrImg = document.getElementById('qr-img');
const qrId = document.getElementById('qr-id');
const copyBtn = document.getElementById('copy-btn');
const statusMsg = document.getElementById('status-msg');

btnGerar.addEventListener('click', gerarQR);

async function gerarQR() {
  const valor = parseFloat(mpValor.value.replace(/\D/g, '')) / 100;
  const descricao = mpDesc.value.trim() || 'Serviço LendaTech';

  if (!valor || valor <= 0) {
    mostrarStatus('💰 Informe um valor válido', false);
    mpValor.focus();
    return;
  }

  btnGerar.disabled = true;
  btnGerar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
  statusMsg.className = 'status-msg';
  qrArea.classList.remove('show');

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': Date.now().toString()
      },
      body: JSON.stringify({
        transaction_amount: valor,
        description: descricao,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@lendatech.com'
        }
      })
    });

    const data = await response.json();
    console.log('MP Response:', data);

    if (data.point_of_interaction?.transaction_data?.qr_code_base64) {
      qrImg.innerHTML = `<img src="data:image/png;base64,${data.point_of_interaction.transaction_data.qr_code_base64}" alt="QR Code Pix">`;
      paymentLink = data.point_of_interaction.transaction_data.ticket_url || '';
      qrId.textContent = `ID: ${data.id}`;
      qrArea.classList.add('show');
      mostrarStatus('✅ QR Code gerado! Válido por 30min', true);
    } else {
      mostrarStatus('❌ Erro ao gerar QR Code', false);
      console.error('MP Response:', data);
    }

  } catch (error) {
    mostrarStatus('❌ Erro de conexão. Tente novamente', false);
    console.error('Erro:', error);
  }

  btnGerar.disabled = false;
  btnGerar.innerHTML = '<i class="fas fa-qrcode"></i> Gerar QR Code Pix';
}


copyBtn.addEventListener('click', copiarLink);

function copiarLink() {
  if (!paymentLink) {
    mostrarStatus('❌ Gere um QR Code primeiro', false);
    return;
  }

  navigator.clipboard.writeText(paymentLink).then(() => {
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    copyBtn.style.background = 'rgba(34,197,94,0.2)';
    copyBtn.style.color = '#22c55e';
    copyBtn.style.borderColor = 'rgba(34,197,94,0.5)';

    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
      copyBtn.style.background = '';
      copyBtn.style.color = '';
      copyBtn.style.borderColor = '';
    }, 2500);

  }).catch((error) => {
    console.error('Erro ao copiar:', error);
    mostrarStatus('❌ Erro ao copiar', false);
  });
}

function mostrarStatus(mensagem, sucesso) {
  statusMsg.textContent = mensagem;
  statusMsg.className = `status-msg show ${sucesso ? 'msg-ok' : 'msg-err'}`;
}

mpValor.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  value = (value / 100).toFixed(2);
  e.target.value = 'R$ ' + parseFloat(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
});

mpValor.addEventListener('blur', () => {
  if (!mpDesc.value.trim()) mpDesc.focus();
});
