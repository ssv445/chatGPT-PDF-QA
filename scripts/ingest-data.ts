import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { client } from '@/utils/supabase-client';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';

import { SupabaseVectorStore } from 'langchain/vectorstores/supabase'

/* Name of directory to retrieve your files from */
const filePath = 'docs';
export const run = async () => {
  try {
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new CustomPDFLoader(path),
    });

    // const loader = new PDFLoader(filePath);
    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.debug('split docs', docs);

    console.log('creating vector store...');
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    const store = new SupabaseVectorStore(embeddings, {
      client,
      tableName: "documents",
    });

    await store.addDocuments(docs);
    //embed the PDF documents
    // await SupabaseVectorStore.fromDocuments(docs, embeddings, {
    //   client: supabaseClient,
    //   tableName: "documents",
    //   queryName: "match_documents",
    //   textKey: 'text',
    // });
  } catch (error) {
    console.log('error', error);
    throw new Error(`Failed to ingest your data ${error}`);
  }
};

(async () => {
  await run();
  console.log('ingestion complete');
})();
