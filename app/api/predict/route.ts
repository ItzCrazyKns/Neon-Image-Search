import { NextRequest, NextResponse } from "next/server";
import { neon, neonConfig } from '@neondatabase/serverless';
import { PredictionServiceClient } from "@google-cloud/aiplatform";

neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);

const vertexAiClient = new PredictionServiceClient({
    apiEndpoint: process.env.GOOGLE_CLOUD_API_ENDPOINT,
})

export const POST = async (req: NextRequest) => {
    try {
        const data = await req.json()
        
        if (!data.base64Image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

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
                                            stringValue: data.base64Image,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        });

        if (!response || response.length < 1 || !response[0]?.predictions || response[0]?.predictions.length < 1) return NextResponse.json({ error: 'No predictions found for image' }, { status: 404 })

        const embeddings = response[0]?.predictions[0]?.structValue?.fields?.imageEmbedding?.listValue?.values?.map((v: any) => v.numberValue)

        const result = await sql(`SELECT  id, type, name FROM items ORDER BY embedding::VECTOR <=> '[${embeddings}]' LIMIT 8;`)

        const similarImages = result.map((item: any) => {
            return {
                id: item.id,
                type: item.type,
                name: item.name,
                image: '/flower_images/' + item.type + '/' + item.name,
            }
        })

        return NextResponse.json({ result: similarImages }, { status: 200 })
    } catch (err) {
        console.error('An error has occurred:', err)
        return NextResponse.json({ error: 'An error has occurred' }, { status: 500 })
    }
}