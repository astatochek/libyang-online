# Libyang Online

A web application for validating XML files against YANG schemas using Libyang compiled to WebAssembly.

## Description

Libyang online is a web-based tool that allows users to easily validate their XML data files using YANG data models. It leverages the powerful [Libyang](https://github.com/CESNET/libyang) library, compiled to WebAssembly (WASM) using Emscripten, to perform the validation directly in the browser. This provides a convenient and accessible way to check the compliance of your XML data with your defined YANG schemas without requiring a local Libyang installation.

## Features

- Validate XML data against uploaded YANG schema files.
- Provides detailed validation results, including errors and warnings.
- Runs entirely in the browser using WebAssembly.

## Deployed Application

The latest version of Libyang online is deployed and available at:

[https://libyang-online.netlify.app/](https://libyang-online.netlify.app/)

## Getting Started

To run this project locally, you'll need Node.js installed.

1. **Clone the repository:**

    ```bash
    git clone https://github.com/astatochek/libyang-online.git
    cd libyang-online
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Compile Libyang to WebAssembly:**

    This project includes a custom script to download the Libyang source code, Emscripten, and compile Libyang to WebAssembly. This process can take some time depending on your internet connection and system performance.

    ```bash
    npm run compile-wasm
    ```

    This script performs the following steps:

    - Clones the [Libyang repository](https://github.com/CESNET/libyang).
    - Downloads and sets up Emscripten.
    - Compiles Libyang and its dependencies to WebAssembly.
    - Places the resulting WASM files in the appropriate directory for the web application to use.

4. **Start the development server:**

    ```bash
    npm run dev
    ```

    This will start a local development server, usually at `http://localhost:5173`.

5. **Open the application:**

    Open your web browser and navigate to the address provided by the development server.

## Development

This project uses [Vite](https://vitejs.dev/) for a fast development experience.

- **Run the development server:**

  ```bash
  npm run dev
  ```

- **Build for production:**

  ```bash
  npm run build
  ```

  This will generate production-ready static files in the `dist` directory.
- **Preview the production build:**

  ```bash
  npm run preview
  ```
