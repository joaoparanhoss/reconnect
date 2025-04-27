// Configurações fixas da API
const API_BASE_URL = "Sua url base" // SUBSTITUA PELA SUA URL BASE
const API_KEY = "Sua Api-key" // SUBSTITUA PELA SUA API KEY

// Configurações da aplicação
let INSTANCE_NAME = ""
const CHECK_INTERVAL = 10000 // Verificar a cada 10 segundos
let checkIntervalId = null
let lastCheckTime = null
let connectionErrorCount = 0
const MAX_ERROR_COUNT = 3 // Número máximo de erros antes de mostrar a mensagem de erro

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Obter o nome da instância da URL
  INSTANCE_NAME = getInstanceNameFromURL()

  if (!INSTANCE_NAME) {
    // Se não houver instância na URL, mostrar mensagem de erro
    document.body.innerHTML = `
      <div class="container" style="text-align: center; padding-top: 50px;">
        <h1 style="color: #f44336;">Erro</h1>
        <p>Nenhuma instância especificada na URL.</p>
        <p>Use o formato: <code>?instance=nome-da-instancia</code></p>
        <p>Exemplo: <code>index.html?instance=default</code></p>
      </div>
    `
    return
  }

  // Atualizar título com nome da instância
  document.getElementById("instance-title").textContent = `Instância: ${INSTANCE_NAME}`
  document.title = `Evolution API - ${INSTANCE_NAME}`

  // Configurar eventos
  document.getElementById("refresh-qrcode").addEventListener("click", fetchQRCode)
  document.getElementById("retry-connection").addEventListener("click", retryConnection)
  document.getElementById("toggle-debug").addEventListener("click", toggleDebugInfo)
  document.getElementById("test-connection").addEventListener("click", testConnection)

  // Preencher informações de debug
  document.getElementById("debug-api-url").textContent = API_BASE_URL
  document.getElementById("debug-instance").textContent = INSTANCE_NAME

  // Iniciar verificação de status
  checkConnectionStatus()
  startStatusCheck()
})

// Obter o nome da instância da URL
function getInstanceNameFromURL() {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get("instance")
}

// Iniciar verificação periódica
function startStatusCheck() {
  if (checkIntervalId) {
    clearInterval(checkIntervalId)
  }
  checkIntervalId = setInterval(checkConnectionStatus, CHECK_INTERVAL)
}

// Tentar novamente a conexão
function retryConnection() {
  // Esconder mensagem de erro
  document.getElementById("error-container").classList.add("hidden")

  // Resetar contador de erros
  connectionErrorCount = 0

  // Verificar status novamente
  checkConnectionStatus()
}

// Alternar exibição das informações de debug
function toggleDebugInfo() {
  const debugContent = document.getElementById("debug-content")
  const toggleButton = document.getElementById("toggle-debug")

  if (debugContent.classList.contains("hidden")) {
    debugContent.classList.remove("hidden")
    toggleButton.textContent = "Ocultar"
  } else {
    debugContent.classList.add("hidden")
    toggleButton.textContent = "Mostrar"
  }
}

// Testar conexão com a API
async function testConnection() {
  const statusElement = document.getElementById("debug-api-status")
  statusElement.textContent = "Testando..."

  try {
    const startTime = Date.now()
    const response = await fetch(`${API_BASE_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: API_KEY,
      },
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (response.ok) {
      statusElement.textContent = `Conectado (${responseTime}ms)`
      statusElement.style.color = "green"
    } else {
      statusElement.textContent = `Erro ${response.status}: ${response.statusText}`
      statusElement.style.color = "red"
    }
  } catch (error) {
    statusElement.textContent = `Falha: ${error.message}`
    statusElement.style.color = "red"
  }
}

// Verificar status da conexão
async function checkConnectionStatus() {
  if (!INSTANCE_NAME) {
    return
  }

  try {
    const statusIndicator = document.getElementById("status-indicator")
    statusIndicator.classList.remove("hidden")

    // Endpoint para verificar o status da conexão na Evolution API v2
    const response = await fetch(`${API_BASE_URL}/instance/connectionState/${INSTANCE_NAME}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: API_KEY,
      },
    })

    // Resetar contador de erros se a requisição for bem-sucedida
    connectionErrorCount = 0

    // Esconder mensagem de erro se estiver visível
    document.getElementById("error-container").classList.add("hidden")

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Resposta da API:", data) // Log para debug

    // Atualizar informações de debug
    lastCheckTime = new Date()
    document.getElementById("debug-last-check").textContent = lastCheckTime.toLocaleTimeString()
    document.getElementById("debug-api-status").textContent = "Conectado"
    document.getElementById("debug-api-status").style.color = "green"

    // Verificar o estado da conexão com base na resposta da Evolution API v2
    // Formato da resposta: { "instance": { "instanceName": "63", "state": "open" } }
    if (data.instance && data.instance.state === "open") {
      handleConnectedState()
    } else {
      handleDisconnectedState()
      // Se desconectado, buscar o QR code
      fetchQRCode()
    }
  } catch (error) {
    console.error("Erro ao verificar status da conexão:", error)

    // Atualizar informações de debug
    lastCheckTime = new Date()
    document.getElementById("debug-last-check").textContent = lastCheckTime.toLocaleTimeString()
    document.getElementById("debug-api-status").textContent = `Erro: ${error.message}`
    document.getElementById("debug-api-status").style.color = "red"

    // Incrementar contador de erros
    connectionErrorCount++

    // Mostrar mensagem de erro após várias tentativas falhas
    if (connectionErrorCount >= MAX_ERROR_COUNT) {
      showConnectionError(error.message)
    }

    handleDisconnectedState()
  } finally {
    const statusIndicator = document.getElementById("status-indicator")
    statusIndicator.classList.add("hidden")
  }
}

// Mostrar erro de conexão
function showConnectionError(errorMessage) {
  const errorContainer = document.getElementById("error-container")
  const errorText = document.getElementById("error-text")

  // Personalizar mensagem de erro
  if (errorMessage.includes("Failed to fetch")) {
    errorText.innerHTML = `
      Não foi possível conectar à API.<br>
      <small>Erro: Failed to fetch - O navegador não conseguiu fazer a requisição para o servidor.</small>
    `
  } else {
    errorText.textContent = errorMessage
  }

  errorContainer.classList.remove("hidden")
}

// Manipular estado conectado
function handleConnectedState() {
  // Atualizar UI
  document.getElementById("connected-view").classList.remove("hidden")
  document.getElementById("disconnected-view").classList.add("hidden")
}

// Manipular estado desconectado
function handleDisconnectedState() {
  // Atualizar UI
  document.getElementById("connected-view").classList.add("hidden")
  document.getElementById("disconnected-view").classList.remove("hidden")
}

// Buscar QR code para reconexão
async function fetchQRCode() {
  if (!INSTANCE_NAME) {
    return
  }

  try {
    // Mostrar indicador de carregamento no botão
    const refreshQrcodeButton = document.getElementById("refresh-qrcode")
    refreshQrcodeButton.textContent = "Carregando..."
    refreshQrcodeButton.disabled = true

    // Endpoint para gerar QR code na Evolution API v2
    const response = await fetch(`${API_BASE_URL}/instance/connect/${INSTANCE_NAME}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Resposta do QR code:", data) // Log para debug

    const qrcodeElement = document.getElementById("qrcode")
    qrcodeElement.innerHTML = "" // Limpar QR code anterior

    // Verificar os diferentes formatos possíveis de resposta do QR code
    if (data.qrcode) {
      // Formato direto: { qrcode: "string-do-qrcode" }
      renderQRCode(data.qrcode, qrcodeElement)
    } else if (data.base64) {
      // Formato base64: { base64: "string-base64" }
      qrcodeElement.innerHTML = `<img src="data:image/png;base64,${data.base64.split(",")[1]}" alt="QR Code" width="256">`
    } else if (data.code) {
      // Outro formato possível: { code: "string-do-qrcode" }
      renderQRCode(data.code, qrcodeElement)
    } else {
      console.error("Formato de QR code não reconhecido:", data)
      qrcodeElement.textContent = "Não foi possível gerar o QR code. Formato não reconhecido."
    }
  } catch (error) {
    console.error("Erro ao buscar QR code:", error)
    const qrcodeElement = document.getElementById("qrcode")
    qrcodeElement.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #f44336;">
        <p>Erro ao obter QR code:</p>
        <p><small>${error.message}</small></p>
      </div>
    `
  } finally {
    // Restaurar botão
    const refreshQrcodeButton = document.getElementById("refresh-qrcode")
    refreshQrcodeButton.textContent = "Atualizar QR Code"
    refreshQrcodeButton.disabled = false
  }
}

// Função auxiliar para renderizar o QR code
function renderQRCode(qrcodeData, element) {
  if (typeof QRCode !== "undefined") {
    QRCode.toCanvas(element, qrcodeData, {
      width: 256,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
  } else {
    console.error("QRCode library is not loaded.")
    element.textContent = "QRCode library is not loaded. Please ensure it is included in the page."
  }
}
