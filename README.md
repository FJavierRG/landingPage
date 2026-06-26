# Landing Page

Landing personal profesional. Stack: Astro + Tailwind CSS.

**Publicada en:** [https://fjavierrg.github.io/landingPage/](https://fjavierrg.github.io/landingPage/)

## Datos de contacto

Edita **`src/config/site.ts`** — ahí van nombre, email, teléfono y LinkedIn.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:4321/landingPage/](http://localhost:4321/landingPage/) (el `base` de GitHub Pages también aplica en local).

## Build

```bash
npm run build
npm run preview
```

## Despliegue en GitHub Pages

1. Sube el código a [github.com/FJavierRG/landingPage](https://github.com/FJavierRG/landingPage)
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Haz push a `main` — el workflow `.github/workflows/deploy.yml` publica automáticamente

```bash
git init
git add .
git commit -m "Initial landing page"
git branch -M main
git remote add origin https://github.com/FJavierRG/landingPage.git
git push -u origin main
```
