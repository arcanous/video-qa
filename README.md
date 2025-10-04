# Getting Started

Setup:

Create .env.local file with:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/videoqa
OPENAI_KEY = '...your key...'
```


```bash
pnpm install

docker compose up -d
```


Then, run the development server:

```bash
pnpm dev
```
