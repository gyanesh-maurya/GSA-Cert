# 🏆 GSA-Cert Portal

**[🚀 Try the Live Website Here!](https://gyanesh-maurya.github.io/GSA-Cert/)**

Say goodbye to manual editing hours. The **GSA-Cert Portal** is a lightning-fast, static web application built to generate aesthetic certificates for Google Student Ambassador Program participants and winners in literally seconds. 

No backend required—everything is processed safely on the client-side using JavaScript. Just drop your student list, crop your signature, and let it cook. 🚀

## ✨ Key Features

- **⚡ Bulk Generation:** Paste a comma-separated list of students and generate hundreds of certificates instantly.
- **✂️ Smart Signature Cropper:** Built-in UI using Cropper.js ensures your signature perfectly fits the required 1660x678 template aspect ratio.
- **📂 Dynamic Template Loading:** Automatically detects and loads available certificate templates based on the months present in your local `./Certificates` directory.
- **📦 Auto-ZIP Downloads:** Compresses all high-quality generated `.jpg` certificates into a single `.zip` file for easy distribution using JSZip and FileSaver.js.
- **💅 Gen-Z Aesthetic:** A beautiful, responsive glass-morphism UI that makes the whole workflow a massive W.


## 📂 Project Structure

```text
├── Certificates/
│   ├── month 1/
│   │   ├── win.jpg
│   │   └── part.jpg
│   └── month 2/
│       ├── win.jpg
│       └── part.jpg
├── fonts/
│   └── GoogleSans-Bold.ttf
├── index.html        # Main App Interface
├── style.css         # UI Styling & Glassmorphism
├── script.js         # Core Generation & Cropping Logic
└── README.md
```

## 💻 Tech Stack

- **HTML5 & CSS3:** For the structural layout and modern glass-morphism aesthetic.
- **Vanilla JavaScript:** For Canvas rendering, logic, and dynamic file handling.
- **[Cropper.js](https://fengyuanchen.github.io/cropperjs/):** For precision signature cropping.
- **[JSZip](https://stuk.github.io/jszip/):** To bundle all generated canvases into a neat archive.
- **[FileSaver.js](https://github.com/eligrey/FileSaver.js):** To trigger the ZIP download on the client side.

## 👨‍💻 Author

Built different with ❤️ by **Gyanesh Maurya**. 
- [LinkedIn](https://www.linkedin.com/in/gyanesh-maurya/)
- [Instagram](https://www.instagram.com/the.gyanesh/)
- [GitHub](https://github.com/gyanesh-maurya/)
