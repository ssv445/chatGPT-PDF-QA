import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";


const privateKey = process.env.SUPABASE_PRIVATE_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);

const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);


async function init() {
  try {
    const client = createClient(url, privateKey);

    // await pinecone.init({
    //   environment: process.env.PINECONE_ENVIRONMENT ?? '', //this is in the dashboard
    //   apiKey: process.env.PINECONE_API_KEY ?? '',
    // });

    return client;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Supabase Client');
  }
}

export const client = await init();
