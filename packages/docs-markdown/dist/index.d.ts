import { docs_v1 } from "googleapis";
export declare const fetchGoogleDocsFiles: (files: string[]) => Promise<void>;
export declare const googleDocsToMarkdown: (file: docs_v1.Schema$Document) => string;
