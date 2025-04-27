// Configuração
const API_BASE_URL = "https://sua-api-evolution.com" // Substitua pela URL da sua API
const INSTANCE_NAME = "default" // Substitua pelo nome da sua instância
const CHECK_INTERVAL = 10000 // Verificar a cada 10 segundos

// Elementos DOM
const statusIndicator = document.getElementById("status-indicator")
const connectedView = document.getElementById("connected-view")
const disconnectedView = document.getElementById("disconnected-view")
const instanceNameElement = document.getElementById("instance-name")
const connectedSinceElement = document.getElementById("connected-since")
const refreshQrcodeButton = document.getElementById("refresh-qrcode")

// Estado da aplicação
const connectionState = {
  isConnected: false,
  qrCode: null,
  instanceInfo: null,
  lastCheck: null,
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  checkConnectionStatus()

  // Configurar verificação periódica
  setInterval(checkConnectionStatus, CHECK_INTERVAL)

  // Configurar evento de atualização do QR code
  refreshQrcodeButton.addEventListener("click", fetchQRCode)
})

// Verificar status da conexão
async function checkConnectionStatus() {
  try {
    statusIndicator.classList.remove("hidden")

    // Endpoint para verificar o status da conexão
    const response = await fetch(`${API_BASE_URL}/instance/status/${INSTANCE_NAME}`)
    const data = await response.json()

    connectionState.lastCheck = new Date()

    if (data.status === "connected" || data.connected === true) {
      handleConnectedState(data)
    } else {
      handleDisconnectedState()
      // Se desconectado, buscar o QR code
      fetchQRCode()
    }
  } catch (error) {
    console.error("Erro ao verificar status da conexão:", error)
    handleDisconnectedState()
  } finally {
    statusIndicator.classList.add("hidden")
  }
}

// Manipular estado conectado
function handleConnectedState(data) {
  connectionState.isConnected = true
  connectionState.instanceInfo = data

  // Atualizar UI
  connectedView.classList.remove("hidden")
  disconnectedView.classList.add("hidden")

  // Preencher informações da instância
  instanceNameElement.textContent = INSTANCE_NAME

  // Formatar data de conexão se disponível
  if (data.connectedAt) {
    const connectedDate = new Date(data.connectedAt)
    connectedSinceElement.textContent = connectedDate.toLocaleString()
  } else {
    connectedSinceElement.textContent = "Informação não disponível"
  }
}

// Manipular estado desconectado
function handleDisconnectedState() {
  connectionState.isConnected = false

  // Atualizar UI
  connectedView.classList.add("hidden")
  disconnectedView.classList.remove("hidden")
}

// Buscar QR code para reconexão
async function fetchQRCode() {
  try {
    // Mostrar indicador de carregamento no botão
    refreshQrcodeButton.textContent = "Carregando..."
    refreshQrcodeButton.disabled = true

    // Endpoint para gerar QR code
    const response = await fetch(`${API_BASE_URL}/instance/qrcode/${INSTANCE_NAME}`)
    const data = await response.json()

    if (data.qrcode) {
      // Atualizar o QR code
      const qrcodeElement = document.getElementById("qrcode")
      qrcodeElement.innerHTML = "" // Limpar QR code anterior

      // Gerar novo QR code
      // Assuming QRCode is available globally or imported elsewhere
      if (typeof QRCode !== "undefined") {
        QRCode.toCanvas(qrcodeElement, data.qrcode, {
          width: 256,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })
      } else {
        console.error("QRCode library is not loaded.")
        qrcodeElement.textContent = "QRCode library is not loaded. Please ensure it is included in the page."
      }

      connectionState.qrCode = data.qrcode
    } else if (data.base64Image) {
      // Alguns APIs retornam o QR code como uma imagem base64
      const qrcodeElement = document.getElementById("qrcode")
      qrcodeElement.innerHTML = `<img src="${data.base64Image}" alt="QR Code" width="256">`
    } else {
      console.error("Formato de QR code não reconhecido:", data)
    }
  } catch (error) {
    console.error("Erro ao buscar QR code:", error)
    alert("Não foi possível obter o QR code. Tente novamente mais tarde.")
  } finally {
    // Restaurar botão
    refreshQrcodeButton.textContent = "Atualizar QR Code"
    refreshQrcodeButton.disabled = false
  }
}

// Função auxiliar para formatar data
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString()
}
