# DepShield 🛡️

**Supply Chain Dependency Security Scanner**

DepShield is a powerful, open-source security tool designed to protect your software supply chain. It scans project dependency files (like `package.json`, `requirements.txt`, and `Gemfile`) to detect and visualize risks associated with typosquatting, dependency confusion, and abandoned packages.

## ✨ Features

- **Multi-Ecosystem Support:** Scan `npm` (JavaScript), `pip` (Python), and `RubyGems` (Ruby) dependencies.
- **Typosquatting Detection:** Identifies packages with names suspiciously similar to popular libraries.
- **Dependency Confusion Alerts:** Flags potential namespace confusion risks.
- **Abandonment Analysis:** Detects packages that are no longer maintained and pose a security risk.
- **Interactive Dashboard:** Beautiful dark-mode UI with risk scores and category breakdowns.
- **Exportable Reports:** Download scan results in JSON or HTML formats.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gavriel953/depshield.git
   cd depshield
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## 🛠️ Built With

- **Vite** - Next Generation Frontend Tooling
- **Vanilla JS/CSS** - Performance-focused implementation
- **Canvas API** - For dynamic risk visualizations

## 🛡️ Security Logic

DepShield uses a variety of heuristics to determine risk:
- **Levenshtein Distance:** To detect typosquatting against a dataset of the top 1000+ most popular packages.
- **Metadata Analysis:** Scanning for patterns indicative of abandoned or unmaintained projects.
- **Registry Checks:** Simulating lookup patterns to identify potential dependency confusion vectors.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---
*Built for cybersecurity defenders by the DepShield team.*
