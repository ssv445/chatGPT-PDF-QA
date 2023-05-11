import { Document } from 'langchain/document';
import { readFile } from 'fs/promises';
import { BaseDocumentLoader } from 'langchain/document_loaders';
import * as fs from 'fs';

export abstract class BufferLoader extends BaseDocumentLoader {
  constructor(public filePathOrBlob: string | Blob) {
    super();
  }

  public prepareTags(fullFilePath: string): string[] {
    const dirPath = fullFilePath.substr(0, fullFilePath.indexOf('/docs/') + 6);
    const jsonPath = dirPath + 'tags.json';
    const filePath = fullFilePath.substr(fullFilePath.indexOf('/docs/') + 6);
    const tags: string[] = filePath.split('/');
    //remove the filename
    tags.pop();
    tags.splice(1);

    //also record this tags to json file
    // Read the existing data from the JSON file
    const fileData = fs.readFileSync(jsonPath, 'utf-8');
    const jsonData = JSON.parse(fileData);

    for (const tag of tags) {
      if (!jsonData.hasOwnProperty(tag)) {
        jsonData[tag] = 1;
      }
    }

    // Write the updated JSON data back to the file
    const updatedData = JSON.stringify(jsonData, null, 2); // null and 2 are optional arguments for pretty-printing the JSON string
    fs.writeFileSync(jsonPath, updatedData, 'utf-8');

    return tags;
  }

  protected abstract parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]>;

  public async load(): Promise<Document[]> {
    let buffer: Buffer;
    let metadata: Record<string, string | string[]>;
    if (typeof this.filePathOrBlob === 'string') {
      buffer = await readFile(this.filePathOrBlob);

      metadata = {
        source: this.filePathOrBlob,
        tags: this.prepareTags(this.filePathOrBlob),
      };
    } else {
      buffer = await this.filePathOrBlob
        .arrayBuffer()
        .then((ab) => Buffer.from(ab));
      metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
    }
    return this.parse(buffer, metadata);
  }
}

export class CustomPDFLoader extends BufferLoader {
  public async parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]> {
    const { pdf } = await PDFLoaderImports();
    const parsed = await pdf(raw);
    return [
      new Document({
        pageContent: parsed.text,
        metadata: {
          ...metadata,
          pdf_numpages: parsed.numpages,
        },
      }),
    ];
  }
}

async function PDFLoaderImports() {
  try {
    // the main entrypoint has some debug code that we don't want to import
    const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
    return { pdf };
  } catch (e) {
    console.error(e);
    throw new Error(
      'Failed to load pdf-parse. Please install it with eg. `npm install pdf-parse`.',
    );
  }
}
