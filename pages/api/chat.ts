import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { makeChain } from '@/utils/makechain';
// import { pinecone } from '@/utils/pinecone-client';
// import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import {client} from '@/utils/supabase-client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { question, history, filters } = req.body;

  console.log('question', question);

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }
  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  try {
    // const index = pinecone.Index(PINECONE_INDEX_NAME);

    // metadata filtering
    // console.dir(filters, { depth: 5 });
    const filter =
      filters?.tags?.filter(Boolean).length > 0
        ? {
          'tags.0': {
            "$in": [ "`${filters.tags[0]}`"]
          },
        }
        : {};

    /* create vectorstore*/
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(
      new OpenAIEmbeddings({}),
      {
        client,
        // filter: filter,
      },
    );

    //create chain
    const chain = makeChain(vectorStore);
    //Ask a question using chat history
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });

    console.dir(response, { depth: 4 });
    res.status(200).json(response);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
