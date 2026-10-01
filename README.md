# MK Construction & Builders

Frontend-only Construction Quotation & Estimation Management System.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL, sign in with the prefilled demo account, and create a quotation from **New Quotation**.

Data is stored in the browser (`localStorage`). Service modules under `src/services/mock` can later be swapped to Axios calls against FastAPI without rewriting screens.
