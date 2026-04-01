chrome.storage.local.get(['dsa_user_id'], (data) => {
    const status = document.getElementById('status')
    if (data.dsa_user_id) {
        status.textContent = '✅ Logged in'
        status.style.color = '#22c55e'
    } else {
        status.textContent = '⚠️ Not logged in — visit dsashadow.com'
        status.style.color = '#f59e0b'
    }
})

function openDashboard() {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' })
}