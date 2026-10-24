# Privacy Policy for EchoScope — Laravel Reverb & WebSocket Inspector

**Last Updated:** October 24, 2026

EchoScope ("we", "our", or "the extension") values your privacy. This Privacy Policy details our data handling practices for developers and users of EchoScope.

---

### 1. No Data Collection, Tracking, or External Storage
EchoScope is an **offline-first, client-side developer utility**:
- We do **NOT** collect, store, transmit, or share any personal data.
- We do **NOT** track your browsing activity, visited URLs, or user behavior.
- We do **NOT** transmit event logs or WebSocket messages to any external telemetry servers or third parties. All event streaming and logs remain 100% local inside your browser session.

---

### 2. Permissions Justification & Usage
The extension requires minimal permissions solely to enable real-time local WebSocket connection and channel debugging:

- **`storage`:** Used exclusively to save developer connection preferences locally on your machine (e.g. host, port, protocol, subscribed channels) so you don't have to re-enter them on popup reload.
- **`activeTab`:** Used when you click the popout button to open the EchoScope inspector in a dedicated browser tab.
- **`host_permissions` (`http://*/*`, `https://*/*`, `ws://*/*`, `wss://*/*`):** Required to connect to your local or remote WebSocket server (e.g. Laravel Reverb on `ws://127.0.0.1:8080`) and send private channel authorization requests to your Laravel broadcasting endpoint (e.g. `http://127.0.0.1:8000/broadcasting/auth`).

---

### 3. Remote Code Compliance
EchoScope does **NOT** download, evaluate, or execute any remote code or external scripts at runtime. All client connection handlers, protocol logic, and UI code are bundled locally within the extension.

---

### 4. Third-Party Sharing
Because EchoScope does not collect any data, no user data is ever sold, transferred, or disclosed to advertisers, data brokers, or third-party organizations.

---

### 5. Open Source & Support
EchoScope is open-source software licensed under the MIT License. If you have any inquiries, bug reports, or feedback regarding this policy, please reach out via GitHub:
- **Repository:** [https://github.com/sajusun/echo-scope](https://github.com/sajusun/echo-scope)
- **Developer:** Sakhawat Hossain
