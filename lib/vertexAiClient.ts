import { PredictionServiceClient } from "@google-cloud/aiplatform";

const vertexAiClient = new PredictionServiceClient({
    apiEndpoint: process.env.GOOGLE_CLOUD_API_ENDPOINT,
})

export default vertexAiClient