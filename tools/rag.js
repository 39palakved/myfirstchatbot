import { vectorStore } from "../prepare.js";

export async function ragQuery({ query }) {
    const chunks = await vectorStore.similaritySearch(query, 3);

    if (!chunks || chunks.length === 0) {
        return "NO_MATCH";
    }

    return chunks.map(c => c.pageContent).join("\n\n");
}
