import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PromptTemplate } from "@langchain/core/prompts";

export const loadAndSplitTheDocs = async (file_path) => {
  // load the uploaded file data
  const loader = new PDFLoader(file_path);
  const docs = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 0,
  });
  const allSplits = await textSplitter.splitDocuments(docs);
  return allSplits;
};

export const vectorSaveAndSearch = async (splits,question) => {
    const embeddings = new OllamaEmbeddings();
    const vectorStore = await MemoryVectorStore.fromDocuments(
        splits,
        embeddings
    );

    const searches = await vectorStore.similaritySearch(question);
    return searches;
};

export const generatePrompt = async (searches,question) =>
{
    let context = "";
    searches.forEach((search) => {
        context = context + "\n\n" + search.pageContent;
    });

    const prompt = PromptTemplate.fromTemplate(`
Answer the question based only on the following context:

{context}

---

Answer the question based on the above context: {question}
`);

    const formattedPrompt = await prompt.format({
        context: context,
        question: question,
    });
    return formattedPrompt;
}


export const generateOutput = async (prompt) =>
{
    const ollamaLlm = new ChatOllama({
        baseUrl: "http://localhost:11434", // Default value
        model: "llama3.2", // Default value
    });

    const response = await ollamaLlm.invoke(prompt);
    return response;
}


