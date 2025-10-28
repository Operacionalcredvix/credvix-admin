// API para capturar informações do cliente (IP, User-Agent, etc.)
// @ts-nocheck
export default defineEventHandler((event) => {
  // Captura IP (considera proxies e load balancers)
  const ip = getRequestIP(event, { xForwardedFor: true })
  
  // Captura User-Agent
  const userAgent = getRequestHeader(event, 'user-agent') || 'Unknown'
  
  // Parse básico do User-Agent para extrair informações
  const parseUserAgent = (ua: string) => {
    let dispositivo = 'Desktop'
    let navegador = 'Unknown'
    let sistemaOperacional = 'Unknown'
    
    // Detecta dispositivo
    if (/mobile/i.test(ua)) {
      dispositivo = 'Mobile'
    } else if (/tablet|ipad/i.test(ua)) {
      dispositivo = 'Tablet'
    }
    
    // Detecta navegador
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      navegador = 'Chrome'
    } else if (ua.includes('Firefox')) {
      navegador = 'Firefox'
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      navegador = 'Safari'
    } else if (ua.includes('Edg')) {
      navegador = 'Edge'
    } else if (ua.includes('Opera') || ua.includes('OPR')) {
      navegador = 'Opera'
    }
    
    // Detecta sistema operacional
    if (ua.includes('Windows')) {
      sistemaOperacional = 'Windows'
    } else if (ua.includes('Mac OS')) {
      sistemaOperacional = 'macOS'
    } else if (ua.includes('Linux')) {
      sistemaOperacional = 'Linux'
    } else if (ua.includes('Android')) {
      sistemaOperacional = 'Android'
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
      sistemaOperacional = 'iOS'
    }
    
    return { dispositivo, navegador, sistemaOperacional }
  }
  
  const parsed = parseUserAgent(userAgent)
  
  return {
    ip,
    userAgent,
    ...parsed
  }
})
