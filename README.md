# Neon Image Search

This is an image search app, built using NeonDB and Vertex AI. It uses Vertex AI to convert the data images into embeddings and then stores it into NeonDB. When a request is made the request image is converted into embeddings and then the similarity search is performed by NeonDB using PGVector.

![preview](./assets//app_preview.png)

## Installation

Before we began with the installation make sure you're logged in, in the [Google Cloud CLI](https://cloud.google.com/docs/authentication/gcloud#gcloud-credentials).

1. Clone the repo

```bash
git clone https://github.com/ItzCrazyKns/Neon-Image-Search.git
```

2. Install dependencies

```bash
yarn
```

Or if you are using NPM

```bash
npm i
```

3. Change the name of `.example.env.local` to `.env.local` and fill all the fields.

4. Convert data images into embeddings. (The data images are stored in `/public/flower_images`)

```bash
yarn run generate-embeddings
```

Or if you are using NPM

```bash
npm run generate-embeddings
```

5. Then finally started the app

```bash
yarn run dev
```

Or if you are using NPM

```bash
npm run dev
```

**Note**: You can build the project then also use it by following NextJS's guidelines.