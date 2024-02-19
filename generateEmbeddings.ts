import { Pool } from 'pg';
import * as fs from "fs/promises"
import * as path from 'path';
import dotenv from 'dotenv';
import { PredictionServiceClient } from '@google-cloud/aiplatform';

dotenv.config({
    path: path.join(__dirname, '.env.local')
});

const vertexAiClient = new PredictionServiceClient({
    apiEndpoint: process.env.GOOGLE_CLOUD_API_ENDPOINT,
})

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

pool.connect()

const baseDir = "./public/flower_images";

const listFolders = async (baseDir: string): Promise<string[]> => {
    const items = await fs.readdir(baseDir, { withFileTypes: true });
    return items.filter(item => item.isDirectory()).map(item => path.join(baseDir, item.name));
};

const listImages = async (folderPath: string): Promise<{ name: string; path: string; folderPath: string; }[]> => {
    const items = await fs.readdir(folderPath, { withFileTypes: true })

    return items.filter(item => item.isFile() && (item.name.includes('.jpg') || item.name.includes('.jpeg') || item.name.includes('.png'))).slice(0, 50).map(item => {
        return {
            path: path.join(folderPath, item.name),
            folderPath: folderPath.split('\\').pop()!,
            name: item.name
        }
    })
}

const imageToBase64 = async (filePath: string): Promise<string> => {
    const fileBuffer = await fs.readFile(filePath)
    return fileBuffer.toString('base64')
}

const convertImagesToEmbeddings = async (): Promise<any[]> => {
    const embeddings: any[] = []
    const folders = await listFolders(baseDir)

    for await (const folder of folders) {
        const images = await listImages(folder)
        for await (const image of images) {
            const base64Image = await imageToBase64(image.path)

            const response = await vertexAiClient.predict({
                endpoint: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/${process.env.GOOGLE_CLOUD_LOCATION}/publishers/google/models/multimodalembedding@001`,
                instances: [
                    {
                        structValue: {
                            fields: {
                                image: {
                                    structValue: {
                                        fields: {
                                            bytesBase64Encoded: {
                                                stringValue: base64Image,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            });

            if (!response || response.length < 1 || !response[0]?.predictions || response[0]?.predictions.length < 1) {
                console.error('No predictions found for image', image.path);
                continue;
            }

            embeddings.push({
                embeddings: response[0]?.predictions[0]?.structValue?.fields?.imageEmbedding?.listValue?.values?.map((v) => v.numberValue),
                type: image.folderPath.split('\\').pop()!,
                name: image.name
            })
        }
    }

    return embeddings
};

const generateEmbeddings = async () => {
    const client = await pool.connect()
    try {
        await client.query(`
        CREATE EXTENSION IF NOT EXISTS vector;
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            type VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            embedding VECTOR(1408) NOT NULL
        )
        `)
        console.log('Successfully created tables')
        console.log('Generating embeddings...')

        const embeddings = await convertImagesToEmbeddings()
        console.log(embeddings)
        console.log('Inserting embeddings into database...')
        await client.query(`
        INSERT INTO items (type, name, embedding) VALUES ${embeddings.map((e) => `('${e.type}', '${e.name}', '[${e.embeddings}]')`).join(',')}
        `)
        console.log('Successfully inserted embeddings into database')
    } catch (err) {
        console.error('An error has occurred:', err)
    } finally {
        client.release()
    }
}

generateEmbeddings()