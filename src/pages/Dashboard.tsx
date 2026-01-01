import {useCallback, useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import type {ClientStatus, WSEvent} from '@/api'
import {api} from '@/api'
import {config} from '@/config'

interface QRModal {
  show: boolean
  phone: string
  image: string
}

export function Dashboard() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Record<string, ClientStatus>>({})
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [qrModal, setQrModal] = useState<QRModal>({
    show: false,
    phone: '',
    image: '',
  })
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({show: false, type: 'success', message: ''})

  // Message form state
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({show: true, type, message})
    setTimeout(() => setNotification((n) => ({...n, show: false})), 3000)
  }, [])

  const fetchClients = useCallback(async () => {
    try {
      const data = await api.getClients()
      setClients(data.clients)

      // Select first client if none selected
      const phones = Object.keys(data.clients)
      if (!selectedClient && phones.length > 0) {
        setSelectedClient(phones[0] ?? '')
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }, [selectedClient])

  // Fetch clients on mount and periodically
  useEffect(() => {
    fetchClients()
    const interval = setInterval(fetchClients, 30000)
    return () => clearInterval(interval)
  }, [fetchClients])

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`${config.WS_URL}/ws`)

    ws.onmessage = (event) => {
      const data: WSEvent = JSON.parse(event.data)
      if (data.code === 'LOGIN_SUCCESS' || data.code === 'LOGOUT_COMPLETE') {
        fetchClients()
        setQrModal({show: false, phone: '', image: ''})
      }
    }

    ws.onclose = () => {
      // Reconnect after 3 seconds
      setTimeout(() => {
        // WebSocket will be recreated on next render
      }, 3000)
    }

    return () => ws.close()
  }, [fetchClients])

  async function handleLogout() {
    try {
      await api.logout()
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  async function handleShowQR(clientPhone: string) {
    setQrModal({show: true, phone: clientPhone, image: ''})
    try {
      const data = await api.getQRCode(clientPhone)
      setQrModal((prev) => ({...prev, image: data.qr_link}))
    } catch {
      showNotification('error', 'Failed to generate QR code')
      setQrModal({show: false, phone: '', image: ''})
    }
  }

  async function handleLogoutClient(clientPhone: string) {
    try {
      await api.logoutClient(clientPhone)
      showNotification('success', `Logged out ${clientPhone}`)
      fetchClients()
    } catch {
      showNotification('error', 'Failed to logout')
    }
  }

  async function handleSendMessage() {
    if (!selectedClient || !phone || !message) return
    setSending(true)
    try {
      await api.sendMessage(selectedClient, {phone, message})
      showNotification('success', 'Message sent successfully')
      setMessage('')
    } catch {
      showNotification('error', 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getClientStatus = (clientPhone: string) => {
    return clients[clientPhone] || {is_connected: false, is_logged_in: false}
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-whatsapp-700 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <div>
              <h1 className="font-bold text-xl">{config.APP_NAME}</h1>
              <p className="text-white/80 text-xs">{config.APP_VERSION}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 transition-colors hover:bg-white/20"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Notification */}
        {notification.show && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${
              notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {notification.message}
            <button type="button" onClick={() => setNotification((n) => ({...n, show: false}))} className="ml-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Clients Section */}
        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-gray-800 text-lg">Clients</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(clients).map(([clientPhone, status]) => {
              const isSelected = selectedClient === clientPhone
              return (
                <div
                  key={clientPhone}
                  className={`rounded-xl border-2 bg-white p-4 shadow-sm transition-colors ${
                    isSelected ? 'border-whatsapp-500' : 'border-transparent'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-3 w-3 rounded-full ${status.is_connected ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <span className="font-medium">{clientPhone}</span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        status.is_logged_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {status.is_logged_in ? 'Logged In' : 'Not Logged In'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {status.is_logged_in ? (
                      <button
                        type="button"
                        onClick={() => handleLogoutClient(clientPhone)}
                        className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm text-white transition-colors hover:bg-red-600"
                      >
                        Logout
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleShowQR(clientPhone)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-whatsapp-600 px-3 py-2 text-sm text-white transition-colors hover:bg-whatsapp-700"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v1h-1v-1zm-4 0h1v1h-1v-1zm2 0h1v1h-1v-1zm2 2h1v1h-1v-1zm-4 0h1v1h-1v-1zm4 2h1v1h-1v-1zm0 2h1v1h-1v-1zm-2 0h1v1h-1v-1zm-2 0h1v1h-1v-1zm-2-2h1v1h-1v-1zm0-2h1v1h-1v-1zm2 2h1v1h-1v-1z" />
                        </svg>
                        Login with QR
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedClient(clientPhone)}
                      className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                        isSelected ? 'bg-whatsapp-100 text-whatsapp-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Quick Send Section */}
        {selectedClient && getClientStatus(selectedClient).is_logged_in && (
          <section className="mb-8">
            <h2 className="mb-4 font-semibold text-gray-800 text-lg">Quick Send</h2>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="628123456789"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-whatsapp-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-gray-700 text-sm">Message</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hello from WhatsApp API!"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-transparent focus:ring-2 focus:ring-whatsapp-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sending || !phone || !message}
                className="rounded-lg bg-whatsapp-600 px-6 py-2 text-white transition-colors hover:bg-whatsapp-700 disabled:bg-gray-300"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </section>
        )}

        {/* API Endpoint Section */}
        {selectedClient && (
          <section>
            <h2 className="mb-4 font-semibold text-gray-800 text-lg">API Endpoint</h2>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <code className="text-gray-600 text-sm">
                {window.location.origin}/api/{selectedClient}
              </code>
            </div>
          </section>
        )}
      </main>

      {/* QR Modal */}
      {qrModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Scan QR Code</h3>
              <button
                type="button"
                onClick={() => setQrModal({show: false, phone: '', image: ''})}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-4 text-gray-600 text-sm">
              Scan this QR code with WhatsApp on your phone to login <strong>{qrModal.phone}</strong>
            </p>
            <div className="flex min-h-[256px] items-center justify-center rounded-lg bg-gray-50 p-4">
              {qrModal.image ? (
                <img src={qrModal.image} alt="QR Code" className="max-w-full" />
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading QR code...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
