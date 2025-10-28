import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Hämta nycklar från .env 
const accessKey = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
const region = process.env.AWS_REGION || "eu-north-1";

// Skapa klient
const client: DynamoDBClient = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});

const db: DynamoDBDocumentClient = DynamoDBDocumentClient.from(client);
const myTable: string = "Chappy";

export { db, myTable };
